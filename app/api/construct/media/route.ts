import { NextResponse } from "next/server";
import sharp from "sharp";

import { getOptionalConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { enforceConstructNumericLimit } from "@/lib/control/construct-subscription.service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "construct-media";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Map<string, "IMAGE" | "DOCUMENT">([
  ["image/jpeg", "IMAGE"],
  ["image/png", "IMAGE"],
  ["image/webp", "IMAGE"],
  ["image/avif", "IMAGE"],
  ["application/pdf", "DOCUMENT"],
]);

function cleanText(value: FormDataEntryValue | null, maximum: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, maximum) : null;
}

function safeSegment(value: string, fallback: string) {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return cleaned || fallback;
}

export async function POST(request: Request) {
  const context = await getOptionalConstructContext();
  if (!context?.user || !context.membership || !context.organization) {
    return NextResponse.json({ error: "Sign in to upload media." }, { status: 401 });
  }
  if (context.membership.role === "VIEWER") {
    return NextResponse.json({ error: "You do not have permission to upload media." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }
  const mediaType = ALLOWED_TYPES.get(file.type);
  if (!mediaType) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP, AVIF or PDF file." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Files must be 10 MB or smaller." }, { status: 400 });
  }

  const organizationId = context.organization.id;
  const actorUserId = context.user.id;
  const prisma = getConstructPrisma();
  try{await enforceConstructNumericLimit(organizationId,"MAX_MEDIA_ITEMS",await prisma.media.count({where:{organizationId}}));}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Media limit reached."},{status:403});}
  const originalName = file.name.slice(0, 255);
  const fileName = safeSegment(originalName, "upload");

  // folderId, not a free-typed folder name: the picker only offers real
  // construct.media_folders rows the user (or the "New folder" action)
  // actually created — raw SQL, see construct-media-folder.actions.ts.
  const folderId = cleanText(formData.get("folderId"), 100);
  let folder = "library";
  if (folderId) {
    const rows = await prisma.$queryRaw<{ path: string }[]>`
      SELECT path FROM construct.media_folders WHERE id = ${folderId}::uuid AND organization_id = ${organizationId}::uuid
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Selected folder not found." }, { status: 400 });
    }
    folder = rows[0].path;
  }
  const storagePath = `${organizationId}/${folder}/${crypto.randomUUID()}-${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let width: number | null = null;
  let height: number | null = null;

  if (mediaType === "IMAGE") {
    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
    } catch {
      return NextResponse.json({ error: "The image file is invalid or damaged." }, { status: 400 });
    }
  }

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message || "The file could not be uploaded." }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const extension = fileName.includes(".") ? fileName.split(".").pop() ?? "" : "";
  try {
    const media = await prisma.$transaction(async (tx) => {
      const created = await tx.media.create({
        data: {
          organizationId,
          fileName,
          originalName,
          storagePath,
          url: publicData.publicUrl,
          altText: cleanText(formData.get("altText"), 300),
          title: cleanText(formData.get("title"), 160),
          description: cleanText(formData.get("description"), 1000),
          folder,
          mimeType: file.type,
          extension,
          fileSize: file.size,
          width,
          height,
          type: mediaType,
        },
      });
      // folderId isn't on the generated client's Media input yet (same
      // regen block as above) — set the column directly.
      if (folderId) {
        await tx.$executeRaw`UPDATE construct.media SET folder_id = ${folderId}::uuid WHERE id = ${created.id}::uuid`;
      }
      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId,
          module: "media",
          action: "upload",
          recordId: created.id,
          title: `Media uploaded: ${originalName}`,
          details: { storagePath, mimeType: file.type, fileSize: file.size },
        },
      });
      return created;
    });
    return NextResponse.json({ media }, { status: 201 });
  } catch {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "The media record could not be saved." }, { status: 500 });
  }
}
