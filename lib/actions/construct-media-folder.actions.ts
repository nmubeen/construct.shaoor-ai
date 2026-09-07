"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

// Raw SQL throughout this file: construct.media_folders exists in
// Postgres but the generated client here couldn't be regenerated (the
// dev server holds the query engine binary locked on Windows) — switch
// to typed prisma.mediaFolder calls once a client regen picks it up.

function requireEditor(role: string) {
  if (role === "VIEWER") redirect("/dashboard/media?error=You do not have permission to manage folders.");
}

function slugifySegment(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export async function createConstructMediaFolderAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const prisma = getConstructPrisma();
  const organizationId = context.organizationId;

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  if (!name) redirect("/dashboard/media?error=Enter a folder name.");
  const segment = slugifySegment(name);
  if (!segment) redirect("/dashboard/media?error=Enter a valid folder name.");

  let path = segment;
  if (parentId) {
    const parent = await prisma.$queryRaw<{ path: string }[]>`
      SELECT path FROM construct.media_folders WHERE id = ${parentId}::uuid AND organization_id = ${organizationId}::uuid
    `;
    if (parent.length === 0) redirect("/dashboard/media?error=Parent folder not found.");
    path = `${parent[0].path}/${segment}`;
  }

  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM construct.media_folders WHERE organization_id = ${organizationId}::uuid AND path = ${path}
  `;
  if (existing.length > 0) redirect("/dashboard/media?error=A folder with that name already exists here.");

  await prisma.$executeRaw`
    INSERT INTO construct.media_folders (organization_id, name, parent_id, path)
    VALUES (${organizationId}::uuid, ${name}, ${parentId}::uuid, ${path})
  `;
  revalidatePath("/dashboard/media");
  redirect("/dashboard/media?folderCreated=1");
}

export async function deleteConstructMediaFolderAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const prisma = getConstructPrisma();
  const organizationId = context.organizationId;
  const id = String(formData.get("id") ?? "").trim();

  const folder = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM construct.media_folders WHERE id = ${id}::uuid AND organization_id = ${organizationId}::uuid
  `;
  if (folder.length === 0) redirect("/dashboard/media?error=Folder not found.");

  const [{ count: childCount }] = await prisma.$queryRaw<{ count: number }[]>`
    SELECT count(*)::int AS count FROM construct.media_folders WHERE parent_id = ${id}::uuid
  `;
  const [{ count: mediaCount }] = await prisma.$queryRaw<{ count: number }[]>`
    SELECT count(*)::int AS count FROM construct.media WHERE folder_id = ${id}::uuid
  `;
  if (Number(childCount) > 0 || Number(mediaCount) > 0) {
    redirect("/dashboard/media?error=Only empty folders can be deleted — move or remove its contents first.");
  }

  await prisma.$executeRaw`DELETE FROM construct.media_folders WHERE id = ${id}::uuid`;
  revalidatePath("/dashboard/media");
  redirect("/dashboard/media?folderDeleted=1");
}
