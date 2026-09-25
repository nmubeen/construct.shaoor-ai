import { NextResponse } from "next/server";

import { getOptionalConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { assertProgressEntitlement } from "@/lib/services/construct-progress.service";
import { ConstructEntitlementError } from "@/lib/control/construct-subscription.service";
import {
  ALLOWED_PROGRESS_PHOTO_TYPES,
  MAX_PROGRESS_PHOTO_SIZE,
  buildProgressPhotoStoragePath,
  deleteProgressPhotoObjects,
  stripProgressPhotoMetadata,
  uploadProgressPhoto,
} from "@/lib/services/construct-progress-media.service";

export const runtime = "nodejs";

function cleanText(value: FormDataEntryValue | null, maximum: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, maximum) : null;
}

export async function POST(request: Request) {
  const context = await getOptionalConstructContext();
  if (!context?.user || !context.membership || !context.organization) {
    return NextResponse.json({ error: "Sign in to upload photos." }, { status: 401 });
  }
  if (context.membership.role === "VIEWER") {
    return NextResponse.json({ error: "You do not have permission to upload photos." }, { status: 403 });
  }

  const organizationId = context.organization.id;
  try {
    await assertProgressEntitlement(organizationId);
  } catch (error) {
    const message = error instanceof ConstructEntitlementError ? error.message : "Private project progress is unavailable on this plan.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const updateId = String(formData.get("updateId") ?? "").trim();
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }
  if (!ALLOWED_PROGRESS_PHOTO_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP or AVIF photo." }, { status: 400 });
  }
  if (file.size > MAX_PROGRESS_PHOTO_SIZE) {
    return NextResponse.json({ error: "Photos must be 10 MB or smaller." }, { status: 400 });
  }
  if (!updateId) {
    return NextResponse.json({ error: "Missing update." }, { status: 400 });
  }

  const prisma = getConstructPrisma();
  // Never trust a client-provided updateId/organizationId alone — this
  // lookup is the actual authorization check for which update the
  // photo is allowed to attach to.
  const update = await prisma.progressUpdate.findFirst({ where: { id: updateId, organizationId }, select: { id: true, status: true } });
  if (!update) return NextResponse.json({ error: "Update not found." }, { status: 404 });
  if (update.status === "WITHDRAWN") return NextResponse.json({ error: "A withdrawn update cannot be changed." }, { status: 400 });
  if (update.status === "PUBLISHED" && context.membership.role !== "OWNER" && context.membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Only Owners and Admins can add photos to a published update." }, { status: 403 });
  }

  let processed: { buffer: Buffer; width: number | null; height: number | null };
  try {
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    processed = await stripProgressPhotoMetadata(rawBuffer);
  } catch {
    return NextResponse.json({ error: "The photo file is invalid or damaged." }, { status: 400 });
  }

  const storagePath = buildProgressPhotoStoragePath(organizationId, updateId, file.name.slice(0, 255));
  // Re-encoded through sharp above, always JPEG-compatible output
  // metadata aside — but we keep the browser-reported content type for
  // the object's Content-Type header since stripProgressPhotoMetadata
  // preserves the original format (sharp.rotate() alone doesn't
  // transcode format).
  const { error: uploadError } = await uploadProgressPhoto(storagePath, processed.buffer, file.type);
  if (uploadError) {
    return NextResponse.json({ error: uploadError || "The photo could not be uploaded." }, { status: 500 });
  }

  const caption = cleanText(formData.get("caption"), 300);
  try {
    const maxOrder = await prisma.progressPhoto.aggregate({ where: { updateId }, _max: { sortOrder: true } });
    const photo = await prisma.$transaction(async (tx) => {
      const created = await tx.progressPhoto.create({
        data: {
          organizationId,
          updateId,
          storagePath,
          caption,
          sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
          mimeType: file.type,
          fileSize: processed.buffer.byteLength,
          width: processed.width,
          height: processed.height,
          createdById: context.user!.id,
        },
      });
      await tx.auditLog.create({
        data: { organizationId, actorUserId: context.user!.id, module: "progress", action: "photo_upload", recordId: created.id, title: "Progress photo uploaded", details: { updateId } },
      });
      return created;
    });
    return NextResponse.json({ photo }, { status: 201 });
  } catch {
    // Compensating cleanup — same convention as /api/construct/media:
    // never leave an orphaned storage object behind a failed DB write.
    await deleteProgressPhotoObjects([storagePath]);
    return NextResponse.json({ error: "The photo record could not be saved." }, { status: 500 });
  }
}
