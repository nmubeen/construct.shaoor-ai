import { FileText, Folder, FolderPlus, ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";

import { MediaUploadForm } from "@/components/dashboard/media/MediaUploadForm";
import { deleteConstructMediaAction } from "@/lib/actions/construct-media.actions";
import { createConstructMediaFolderAction, deleteConstructMediaFolderAction } from "@/lib/actions/construct-media-folder.actions";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

// Raw SQL throughout this page: construct.media_folders and
// construct.media.folder_id exist in Postgres but the generated client
// here couldn't be regenerated (dev server holds the query engine
// binary locked on Windows) — switch to typed prisma.mediaFolder /
// media.folderId calls once a client regen picks them up.

type FolderRow = { id: string; name: string; parentId: string | null; path: string };
type FolderNode = FolderRow & { depth: number; mediaCount: number; children: FolderNode[] };
type MediaRow = { id: string; originalName: string; title: string | null; url: string; altText: string | null; type: "IMAGE" | "DOCUMENT"; folder: string | null; folderId: string | null; fileSize: number; width: number | null; height: number | null };

function readableSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildTree(folders: FolderRow[], counts: Map<string, number>): FolderNode[] {
  const byParent = new Map<string | null, FolderRow[]>();
  for (const folder of folders) {
    const key = folder.parentId;
    byParent.set(key, [...(byParent.get(key) ?? []), folder]);
  }
  function attach(parentId: string | null, depth: number): FolderNode[] {
    return (byParent.get(parentId) ?? []).map((folder) => ({
      ...folder,
      depth,
      mediaCount: counts.get(folder.id) ?? 0,
      children: attach(folder.id, depth + 1),
    }));
  }
  return attach(null, 0);
}

function flatten(nodes: FolderNode[]): FolderNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

function FolderRowView({ node, activeFolder, canEdit }: { node: FolderNode; activeFolder?: string; canEdit: boolean }) {
  const isEmpty = node.mediaCount === 0 && node.children.length === 0;
  const isActive = activeFolder === node.id;
  return (
    <details open style={{ marginLeft: node.depth > 0 ? "0.9rem" : 0 }}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md py-1 pr-1 text-sm marker:content-none">
        <a href={`/dashboard/media?folder=${node.id}`} className={`flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-md px-1.5 py-1 font-medium ${isActive ? "bg-[#eef3ec] text-[#094136]" : "text-slate-700 hover:bg-slate-100"}`}>
          <Folder className="size-4 shrink-0" />
          <span className="truncate">{node.name}</span>
          <span className="shrink-0 text-xs font-normal text-slate-400">({node.mediaCount})</span>
        </a>
        {canEdit && (
          <form action={deleteConstructMediaFolderAction}>
            <input type="hidden" name="id" value={node.id} />
            <button
              type="submit"
              disabled={!isEmpty}
              title={isEmpty ? "Delete this empty folder" : "Only empty folders can be deleted — move or remove its contents first"}
              className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
            >
              <Trash2 className="size-3.5" />
            </button>
          </form>
        )}
      </summary>
      {node.children.map((child) => <FolderRowView key={child.id} node={child} activeFolder={activeFolder} canEdit={canEdit} />)}
    </details>
  );
}

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ deleted?: string; error?: string; folderCreated?: string; folderDeleted?: string; folder?: string }> }) {
  const context = await requireActiveConstructContext();
  const prisma = getConstructPrisma();
  const organizationId = context.organizationId;
  const query = await searchParams;
  const canEdit = context.role !== "VIEWER";
  const canDeleteMedia = context.role === "OWNER" || context.role === "ADMIN";
  const activeFolder = query.folder;

  const [folderRows, countRows, unfiledCount] = await Promise.all([
    prisma.$queryRaw<FolderRow[]>`SELECT id, name, parent_id AS "parentId", path FROM construct.media_folders WHERE organization_id = ${organizationId}::uuid ORDER BY path ASC`,
    prisma.$queryRaw<{ folderId: string; count: number }[]>`SELECT folder_id AS "folderId", count(*)::int AS count FROM construct.media WHERE organization_id = ${organizationId}::uuid AND folder_id IS NOT NULL GROUP BY folder_id`,
    prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS count FROM construct.media WHERE organization_id = ${organizationId}::uuid AND folder_id IS NULL`,
  ]);
  const counts = new Map(countRows.map((row) => [row.folderId, row.count]));
  const tree = buildTree(folderRows, counts);
  const flatFolders = flatten(tree).map(({ id, name, depth }) => ({ id, name, depth }));

  const media = activeFolder === "none"
    ? await prisma.$queryRaw<MediaRow[]>`SELECT id, original_name AS "originalName", title, url, alt_text AS "altText", type, folder, folder_id AS "folderId", file_size AS "fileSize", width, height FROM construct.media WHERE organization_id = ${organizationId}::uuid AND folder_id IS NULL ORDER BY created_at DESC`
    : activeFolder
      ? await prisma.$queryRaw<MediaRow[]>`SELECT id, original_name AS "originalName", title, url, alt_text AS "altText", type, folder, folder_id AS "folderId", file_size AS "fileSize", width, height FROM construct.media WHERE organization_id = ${organizationId}::uuid AND folder_id = ${activeFolder}::uuid ORDER BY created_at DESC`
      : await prisma.$queryRaw<MediaRow[]>`SELECT id, original_name AS "originalName", title, url, alt_text AS "altText", type, folder, folder_id AS "folderId", file_size AS "fileSize", width, height FROM construct.media WHERE organization_id = ${organizationId}::uuid ORDER BY created_at DESC`;

  const activeFolderName = activeFolder === "none" ? "No folder" : activeFolder ? flatFolders.find((f) => f.id === activeFolder)?.name ?? "Folder" : null;

  return <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <header className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7D9D76]">Website CMS</p><h1 className="mt-2 text-3xl font-bold">Media Library</h1><p className="mt-2 text-sm text-slate-600">Upload reusable images and documents for this tenant&apos;s website.</p></header>
    {query.deleted && <p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm text-[#7D9D76]">Media deleted successfully.</p>}
    {query.folderCreated && <p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm text-[#7D9D76]">Folder created successfully.</p>}
    {query.folderDeleted && <p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm text-[#7D9D76]">Folder deleted successfully.</p>}
    {query.error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
    {canEdit && <div className="mb-6"><MediaUploadForm folders={flatFolders} defaultFolderId={activeFolder && activeFolder !== "none" ? activeFolder : undefined} /></div>}
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-950"><Folder className="size-4 text-[#7D9D76]" />Folders</h2>
        <a href="/dashboard/media" className={`mb-1 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium ${!activeFolder ? "bg-[#eef3ec] text-[#094136]" : "text-slate-700 hover:bg-slate-100"}`}>All media</a>
        <a href="/dashboard/media?folder=none" className={`mb-2 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium ${activeFolder === "none" ? "bg-[#eef3ec] text-[#094136]" : "text-slate-700 hover:bg-slate-100"}`}>No folder <span className="text-xs font-normal text-slate-400">({unfiledCount[0]?.count ?? 0})</span></a>
        <div className="space-y-0.5 border-t border-slate-100 pt-2">
          {tree.length === 0 ? <p className="px-1.5 py-2 text-xs text-slate-400">No folders yet.</p> : tree.map((node) => <FolderRowView key={node.id} node={node} activeFolder={activeFolder} canEdit={canEdit} />)}
        </div>
        {canEdit && <form action={createConstructMediaFolderAction} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><FolderPlus className="size-3.5" />New folder</p>
          <input name="name" placeholder="Folder name" maxLength={80} required className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm" />
          <select name="parentId" defaultValue="" className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm">
            <option value="">Top level</option>
            {flatFolders.map((folder) => <option key={folder.id} value={folder.id}>{"  ".repeat(folder.depth)}{folder.name}</option>)}
          </select>
          <button className="w-full rounded-md bg-[#094136] px-3 py-2 text-xs font-semibold text-white">Create folder</button>
        </form>}
      </aside>
      <div>
        {activeFolderName && <p className="mb-3 text-sm text-slate-600">Showing: <strong>{activeFolderName}</strong> · <a href="/dashboard/media" className="text-[#7D9D76] underline">clear filter</a></p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {media.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 sm:col-span-2 xl:col-span-3"><ImageIcon className="mx-auto mb-3 size-8" />No media files here yet.</div> : media.map((item) => <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="relative grid aspect-[16/10] place-items-center bg-slate-100">
              {item.type === "IMAGE" ? <Image src={item.url} alt={item.altText || item.title || item.originalName} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw" unoptimized className="object-cover" /> : <FileText className="size-12 text-slate-400" />}
            </div>
            <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-bold text-slate-950">{item.title || item.originalName}</h2><p className="mt-1 truncate text-xs text-slate-500">{item.originalName}</p></div>{canDeleteMedia && <form action={deleteConstructMediaAction}><input type="hidden" name="id" value={item.id} /><button title="Delete media" className="rounded-lg border border-red-200 p-2 text-red-700"><Trash2 className="size-4" /></button></form>}</div>
              <p className="mt-3 text-xs text-slate-500">{item.folder || "library"} · {readableSize(item.fileSize)}{item.width && item.height ? ` · ${item.width}×${item.height}` : ""}</p>
              <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-[#7D9D76] hover:underline">Open public URL</a>
            </div>
          </article>)}
        </div>
      </div>
    </div>
  </div>;
}
