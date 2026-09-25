import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, FileEdit, Pencil, Plus } from "lucide-react";

import { ConfirmActionButton } from "@/components/dashboard/shared/ConfirmActionButton";
import { DismissOnEdit } from "@/components/dashboard/shared/DismissOnEdit";
import { MilestoneManager } from "@/components/progress/MilestoneManager";
import { ProgressAccessPanel } from "@/components/progress/ProgressAccessPanel";
import { createProgressUpdateDraftAction, publishProgressChangesAction, setProgressLifecycleAction } from "@/lib/actions/construct-progress.actions";
import { appUrl } from "@/lib/construct-app-url";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { getConstructEntitlements } from "@/lib/control/construct-subscription.service";
import { getProgressPendingChanges } from "@/lib/services/construct-progress.service";

const LIFECYCLE_STYLE: Record<string, string> = {
  PLANNED: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-[#eef3ec] text-(--color-secondary-text-icon)",
  ON_HOLD: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  ARCHIVED: "bg-slate-100 text-slate-400",
};

const UPDATE_STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-[#eef3ec] text-(--color-secondary-text-icon)",
  WITHDRAWN: "bg-red-50 text-red-700",
};

export default async function ProgressProjectWorkspacePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ updated?: string; published?: string; revoked?: string; discarded?: string; error?: string }> }) {
  const context = await requireActiveConstructContext();
  const { id } = await params;
  const query = await searchParams;
  const prisma = getConstructPrisma();

  const [project, milestones, updates, entitlements] = await Promise.all([
    prisma.progressProject.findFirst({ where: { id, organizationId: context.organizationId } }),
    prisma.progressMilestone.findMany({ where: { organizationId: context.organizationId, projectId: id }, orderBy: { sortOrder: "asc" } }),
    prisma.progressUpdate.findMany({ where: { organizationId: context.organizationId, projectId: id }, orderBy: [{ status: "asc" }, { updateDate: "desc" }] }),
    getConstructEntitlements(context.organizationId),
  ]);
  if (!project) notFound();

  const [pendingChanges, activity] = await Promise.all([
    getProgressPendingChanges(context.organizationId, id),
    prisma.auditLog.findMany({ where: { organizationId: context.organizationId, module: "progress", recordId: { in: [id, ...updates.map((u) => u.id)] } }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const isEntitled = Boolean(entitlements?.entitlements.find((e) => e.featureCode === "PRIVATE_PROJECT_PROGRESS")?.booleanValue);
  const canEdit = context.role !== "VIEWER";
  const isApprover = context.role === "OWNER" || context.role === "ADMIN";
  const accessEnabled = Boolean(project.accessTokenHash) && !project.accessRevokedAt && (!project.accessExpiresAt || project.accessExpiresAt > new Date());
  const isExpired = Boolean(project.accessExpiresAt && project.accessExpiresAt <= new Date());

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Link href="/dashboard/progress" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-(--color-secondary-text-icon)"><ArrowLeft className="size-4" />Back to projects</Link>

      {query.updated && <DismissOnEdit><p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm text-(--color-secondary-text-icon)">Saved.</p></DismissOnEdit>}
      {query.published && <DismissOnEdit><p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm font-semibold text-(--color-primary-text)">Changes published — this is now what the customer sees.</p></DismissOnEdit>}
      {query.revoked && <DismissOnEdit><p className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Customer access revoked.</p></DismissOnEdit>}
      {query.discarded && <DismissOnEdit><p className="mb-5 rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700">Draft discarded.</p></DismissOnEdit>}
      {query.error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
      {!isEntitled && <p className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Private project progress pages are not included in the current plan. Existing data stays intact and access can still be revoked, but creating, editing, uploading and publishing are disabled until the plan is upgraded. <Link href="/dashboard/settings" className="font-semibold underline">See plans</Link>.</p>}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${LIFECYCLE_STYLE[project.lifecycle]}`}>{project.lifecycle.replace("_", " ")}</span>
            <span className="text-xs text-slate-500">for {project.customerName}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-(--color-primary-text)">{project.title}</h1>
          {project.currentStage && <p className="mt-1 text-sm text-slate-600">{project.currentStage}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/dashboard/progress/${id}/preview`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Eye className="size-4" />Preview</Link>
          {canEdit && isEntitled && <Link href={`/dashboard/progress/${id}/edit`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Pencil className="size-4" />Edit details</Link>}
          {isApprover && isEntitled && (
            <form action={publishProgressChangesAction}>
              <input type="hidden" name="id" value={id} />
              <button disabled={!pendingChanges.hasPendingChanges} className="rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pendingChanges.hasNeverPublished ? "Publish" : "Publish changes"}</button>
            </form>
          )}
        </div>
      </div>

      {pendingChanges.hasPendingChanges && (
        <p className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {pendingChanges.hasNeverPublished ? "This project has never been published — the customer page won't work until it is." : "There are unpublished changes to the project summary or milestones. The customer still sees the version from the last publish."}
          {pendingChanges.lastPublishedAt && ` Last published ${pendingChanges.lastPublishedAt.toLocaleString()}.`}
        </p>
      )}

      {canEdit && isEntitled && (
        <form action={setProgressLifecycleAction} className="mb-6 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-3">
          <input type="hidden" name="id" value={id} />
          <span className="text-xs font-semibold text-slate-500">Move to:</span>
          {["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"].filter((l) => l !== project.lifecycle).map((l) => (
            l === "ARCHIVED" ? (
              <ConfirmActionButton key={l} name="lifecycle" value={l} message="Archive this project? This preserves its history but revokes customer access." className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Archived</ConfirmActionButton>
            ) : (
              <button key={l} name="lifecycle" value={l} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">{l.replace("_", " ").charAt(0) + l.replace("_", " ").slice(1).toLowerCase()}</button>
            )
          ))}
        </form>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-(--color-primary-text)">Milestones</h2>
            <MilestoneManager projectId={id} milestones={milestones} canEdit={canEdit && isEntitled} />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-(--color-primary-text)">Updates</h2>
              {canEdit && isEntitled && (
                <form action={createProgressUpdateDraftAction}>
                  <input type="hidden" name="projectId" value={id} />
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Plus className="size-3.5" />New update</button>
                </form>
              )}
            </div>
            {updates.length === 0 ? (
              <p className="text-sm text-slate-500">No updates yet.</p>
            ) : (
              <ul className="space-y-2">
                {updates.map((u) => (
                  <li key={u.id}>
                    <Link href={`/dashboard/progress/${id}/updates/${u.id}`} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 p-3 hover:bg-slate-50">
                      <span className="flex items-center gap-2 truncate"><FileEdit className="size-4 shrink-0 text-slate-400" /><span className="truncate text-sm font-semibold text-slate-800">{u.title || "Untitled update"}</span></span>
                      <span className="flex shrink-0 items-center gap-2"><span className="text-xs text-slate-400">{u.updateDate.toLocaleDateString()}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${UPDATE_STATUS_STYLE[u.status]}`}>{u.status}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-(--color-primary-text)">Activity</h2>
            {activity.length === 0 ? <p className="text-sm text-slate-500">No activity recorded.</p> : (
              <ul className="space-y-2">
                {activity.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-4 text-sm"><span className="text-slate-700">{entry.title}</span><time className="shrink-0 text-xs text-slate-400">{entry.createdAt.toLocaleString()}</time></li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-(--color-primary-text)">Customer access</h2>
            <ProgressAccessPanel projectId={id} publicUrlBase={`${appUrl()}/progress`} accessEnabled={accessEnabled} isExpired={isExpired} isRevoked={Boolean(project.accessRevokedAt)} expiresAt={project.accessExpiresAt} canManage={isApprover} />
            {(project.openCount > 0) && <p className="mt-3 text-xs text-slate-500">Opened {project.openCount} time{project.openCount === 1 ? "" : "s"}{project.lastOpenedAt ? `, last ${project.lastOpenedAt.toLocaleString()}` : ""}.</p>}
          </section>

          {project.customerEmail || project.customerPhone ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-(--color-primary-text)">Private contact details</h2>
              {project.customerEmail && <p className="text-sm text-slate-700">{project.customerEmail}</p>}
              {project.customerPhone && <p className="text-sm text-slate-700">{project.customerPhone}</p>}
              <p className="mt-2 text-xs text-slate-400">Never shown on the customer page.</p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
