import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";

// Feeds every ImageUrlField/ImageUrlList across the admin: the org's
// most recently uploaded images plus its folder tree, for the "Browse
// library" picker. Capped so a page with several image fields (e.g.
// Site settings) isn't re-embedding an unbounded media list once per
// field — typing a URL by hand still works for anything older than this.
const PICKER_LIMIT = 200;

export type PickerImage = { id: string; url: string; title: string | null; originalName: string; folderId: string | null };
export type PickerFolder = { id: string; name: string; depth: number };

// Raw SQL for folder_id: construct.media_folders / media.folder_id exist
// in Postgres but the generated client here couldn't be regenerated (dev
// server holds the query engine binary locked on Windows) — switch to a
// typed prisma.media.findMany({ select: { folderId: true } }) plus
// prisma.mediaFolder.findMany() once a client regen picks them up.
export async function getConstructMediaPickerData(organizationId: string): Promise<{ images: PickerImage[]; folders: PickerFolder[] }> {
  const prisma = getConstructPrisma();
  const [images, folderRows] = await Promise.all([
    prisma.$queryRaw<PickerImage[]>`
      SELECT id, url, title, original_name AS "originalName", folder_id AS "folderId"
      FROM construct.media
      WHERE organization_id = ${organizationId}::uuid AND type = 'IMAGE'
      ORDER BY created_at DESC
      LIMIT ${PICKER_LIMIT}
    `,
    prisma.$queryRaw<{ id: string; name: string; parentId: string | null; path: string }[]>`
      SELECT id, name, parent_id AS "parentId", path
      FROM construct.media_folders
      WHERE organization_id = ${organizationId}::uuid
      ORDER BY path ASC
    `,
  ]);

  // Flatten into a depth-annotated list (parents before children, each
  // child indented under its parent) — simplest shape for a picker
  // sidebar, no need for the full nested-tree structure the Media
  // Library page itself uses.
  const byParent = new Map<string | null, typeof folderRows>();
  for (const folder of folderRows) byParent.set(folder.parentId, [...(byParent.get(folder.parentId) ?? []), folder]);
  const folders: PickerFolder[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const folder of byParent.get(parentId) ?? []) {
      folders.push({ id: folder.id, name: folder.name, depth });
      walk(folder.id, depth + 1);
    }
  }
  walk(null, 0);

  return { images, folders };
}

// Back-compat for any caller that only needs the flat image list.
export async function getConstructPickableImages(organizationId: string) {
  const { images } = await getConstructMediaPickerData(organizationId);
  return images;
}
