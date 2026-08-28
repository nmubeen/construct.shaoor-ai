"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { createClient } from "@/lib/supabase/server";

export async function deleteConstructMediaAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  if (context.role !== "OWNER" && context.role !== "ADMIN") {
    redirect("/dashboard/media?error=Only Owners and Admins can delete media.");
  }

  const id = String(formData.get("id") ?? "").trim();
  const prisma = getConstructPrisma();
  const media = await prisma.media.findFirst({
    where: { id, organizationId: context.organizationId },
    select: { id: true, originalName: true, storagePath: true },
  });
  if (!media) redirect("/dashboard/media?error=Media file not found.");

  const supabase = await createClient();
  const { error: storageError } = await supabase.storage.from("construct-media").remove([media.storagePath]);
  if (storageError) {
    redirect(`/dashboard/media?error=${encodeURIComponent(`Storage deletion failed: ${storageError.message}`)}`);
  }

  try {
    await prisma.$transaction([
      prisma.media.delete({ where: { id: media.id } }),
      prisma.auditLog.create({
        data: {
          organizationId: context.organizationId,
          actorUserId: context.userId,
          module: "media",
          action: "delete",
          recordId: media.id,
          title: `Media deleted: ${media.originalName}`,
          details: { storagePath: media.storagePath },
        },
      }),
    ]);
  } catch {
    redirect("/dashboard/media?error=The file was removed from storage, but its media record could not be deleted.");
  }

  revalidatePath("/dashboard/media");
  redirect("/dashboard/media?deleted=1");
}
