import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ConfirmActionButton } from "@/components/dashboard/shared/ConfirmActionButton";
import { DismissOnEdit } from "@/components/dashboard/shared/DismissOnEdit";
import { ProgressPhotoUploader } from "@/components/progress/ProgressPhotoUploader";
import { ProgressUpdateEditorForm } from "@/components/progress/ProgressUpdateEditorForm";
import { addPublicReferencePhotoAction, discardProgressUpdateDraftAction, publishProgressUpdateAction, withdrawProgressUpdateAction } from "@/lib/actions/construct-progress.actions";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { getConstructEntitlements } from "@/lib/control/construct-subscription.service";
import { signProgressPhotos } from "@/lib/services/construct-progress-media.service";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-[#eef3ec] text-(--color-secondary-text-icon)",
  WITHDRAWN: "bg-red-50 text-red-700",
};

export default async function ProgressUpdateEditorPage({ params, searchParams }: { params: Promise<{ id: string; updateId: string }>; searchParams: Promise<{ published?: string; withdrawn?: string; error?: string }> }) {
  const context = await requireActiveConstructContext();
  const { id, updateId } = await params;
  const query = await searchParams;
  const prisma = getConstructPrisma();

  const [update, project, milestones, entitlements, publicImages] = await Promise.all([
    prisma.progressUpdate.findFirst({ where: { id: updateId, organizationId: context.organizationId, projectId: id }, include: { photos: { orderBy: { sortOrder: "asc" } } } }),
    prisma.progressProject.findFirst({ where: { id, organizationId: context.organizationId }, select: { id: true, title: true } }),
    prisma.progressMilestone.findMany({ where: { organizationId: context.organizationId, projectId: id }, orderBy: { sortOrder: "asc" } }),
    getConstructEntitlements(context.organizationId),
    prisma.media.findMany({ where: { organizationId: context.organizationId, type: "IMAGE" }, orderBy: { createdAt: "desc" }, take: 60, select: { id: true, url: true, title: true, originalName: true } }),
  ]);
  if (!update || !project) notFound();

  const isEntitled = Boolean(entitlements?.entitlements.find((e) => e.featureCode === "PRIVATE_PROJECT_PROGRESS")?.booleanValue);
  const isApprover = context.role === "OWNER" || context.role === "ADMIN";
  const canEditDraft = context.role !== "VIEWER" && update.status === "DRAFT";
  const canEditPublished = isApprover && update.status === "PUBLISHED";
  const canEditContent = (canEditDraft || canEditPublished) && isEntitled;

  const signedPhotos = await signProgressPhotos(update.photos.map((p) => ({ id: p.id, storagePath: p.storagePath, publicImageUrl: p.publicImageUrl, caption: p.caption })));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Link href={`/dashboard/progress/${id}`} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-(--color-secondary-text-icon)"><ArrowLeft className="size-4" />Back to {project.title}</Link>

      {query.published && <DismissOnEdit><p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm font-semibold text-(--color-primary-text)">Update published.</p></DismissOnEdit>}
      {query.withdrawn && <DismissOnEdit><p className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Update withdrawn — it no longer appears on the customer page.</p></DismissOnEdit>}
      {query.error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
      {!isEntitled && update.status === "DRAFT" && <p className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Private project progress pages are not included in the current plan — this draft is read-only until the plan is upgraded, but you can still discard it.</p>}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${STATUS_STYLE[update.status]}`}>{update.status}</span>
        <h1 className="text-2xl font-bold text-(--color-primary-text)">{update.title || "Untitled update"}</h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-(--color-primary-text)">Content</h2>
            <ProgressUpdateEditorForm update={update} milestones={milestones} readOnly={!canEditContent} />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 font-bold text-(--color-primary-text)">Photos</h2>
            <p className="mb-4 text-xs text-slate-500">Ordered photographs shown with this update. Uploaded photos are private — only visible via a signed link issued to someone with access.</p>
            <ProgressPhotoUploader updateId={update.id} photos={signedPhotos} canEdit={canEditContent} />
            {canEditContent && publicImages.length > 0 && (
              <form action={addPublicReferencePhotoAction} className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                <input type="hidden" name="updateId" value={update.id} />
                <select name="imageUrl" required className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">Or use an existing public portfolio image…</option>{publicImages.map((m) => <option key={m.id} value={m.url}>{m.title || m.originalName}</option>)}</select>
                <input name="caption" placeholder="Caption (optional)" maxLength={300} className="w-48 rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Add</button>
              </form>
            )}
            {canEditContent && publicImages.length > 0 && <p className="mt-1 text-xs text-slate-400">This image is already public on your website — adding it here does not make it private.</p>}
          </section>
        </div>

        <aside className="space-y-3">
          {isApprover && update.status === "DRAFT" && isEntitled && (
            <form action={publishProgressUpdateAction}><input type="hidden" name="id" value={update.id} /><button className="w-full rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white">Publish update</button></form>
          )}
          {isApprover && update.status === "PUBLISHED" && (
            <form action={withdrawProgressUpdateAction}><input type="hidden" name="id" value={update.id} /><ConfirmActionButton message="Withdraw this update? It will no longer appear on the customer page." className="w-full rounded-md border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Withdraw update</ConfirmActionButton></form>
          )}
          {context.role !== "VIEWER" && update.status === "DRAFT" && (
            <form action={discardProgressUpdateDraftAction}><input type="hidden" name="id" value={update.id} /><ConfirmActionButton message="Discard this draft update and its photos? This cannot be undone." className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Discard draft</ConfirmActionButton></form>
          )}
          {update.publishedAt && <p className="text-xs text-slate-500">Published {update.publishedAt.toLocaleString()}</p>}
          {update.withdrawnAt && <p className="text-xs text-slate-500">Withdrawn {update.withdrawnAt.toLocaleString()}</p>}
        </aside>
      </div>
    </div>
  );
}
