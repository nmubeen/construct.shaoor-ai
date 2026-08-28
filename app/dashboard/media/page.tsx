import { FileText, ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";

import { MediaUploadForm } from "@/components/dashboard/media/MediaUploadForm";
import { deleteConstructMediaAction } from "@/lib/actions/construct-media.actions";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

function readableSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ deleted?: string; error?: string }> }) {
  const context = await requireActiveConstructContext();
  const media = await getConstructPrisma().media.findMany({
    where: { organizationId: context.organizationId },
    orderBy: { createdAt: "desc" },
  });
  const query = await searchParams;

  return <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <header className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Website CMS</p><h1 className="mt-2 text-3xl font-bold">Media Library</h1><p className="mt-2 text-sm text-slate-600">Upload reusable images and documents for this tenant&apos;s website.</p></header>
    {query.deleted && <p className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">Media deleted successfully.</p>}
    {query.error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
    {context.role !== "VIEWER" && <div className="mb-6"><MediaUploadForm /></div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {media.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 sm:col-span-2 xl:col-span-3"><ImageIcon className="mx-auto mb-3 size-8" />No media files yet.</div> : media.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative grid aspect-[16/10] place-items-center bg-slate-100">
          {item.type === "IMAGE" ? <Image src={item.url} alt={item.altText || item.title || item.originalName} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw" unoptimized className="object-cover" /> : <FileText className="size-12 text-slate-400" />}
        </div>
        <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-bold text-slate-950">{item.title || item.originalName}</h2><p className="mt-1 truncate text-xs text-slate-500">{item.originalName}</p></div>{(context.role === "OWNER" || context.role === "ADMIN") && <form action={deleteConstructMediaAction}><input type="hidden" name="id" value={item.id} /><button title="Delete media" className="rounded-lg border border-red-200 p-2 text-red-700"><Trash2 className="size-4" /></button></form>}</div>
          <p className="mt-3 text-xs text-slate-500">{item.folder || "library"} · {readableSize(item.fileSize)}{item.width && item.height ? ` · ${item.width}×${item.height}` : ""}</p>
          <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-teal-700 hover:underline">Open public URL</a>
        </div>
      </article>)}
    </div>
  </div>;
}
