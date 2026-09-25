import Image from "next/image";
import { CalendarClock, CheckCircle2, Mail, Phone } from "lucide-react";

import { PhotoLightbox } from "@/components/progress/PhotoLightbox";
import type { ProgressSnapshot } from "@/lib/services/construct-progress-snapshot.service";
import type { ResolvedConstructProgressUpdate } from "@/lib/services/construct-progress-public.service";

const LIFECYCLE_LABEL: Record<string, string> = {
  PLANNED: "Planned",
  ACTIVE: "In progress",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

// Shared between the public /progress/[token] page and the dashboard's
// own staff preview — exactly one place renders "what the customer sees",
// same reasoning as ProposalContentView. Takes a ProgressSnapshot (the
// published summary+milestones) plus a live-queried list of published
// updates — see construct-progress-public.service.ts's own comment for
// why updates aren't embedded in the snapshot itself.
export function ProgressContentView({ snapshot: s, updates, milestoneCompletion }: { snapshot: ProgressSnapshot; updates: ResolvedConstructProgressUpdate[]; milestoneCompletion: { completed: number; total: number } }) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
        {s.branding.logoUrl && <Image src={s.branding.logoUrl} alt={s.branding.companyName} width={48} height={48} unoptimized className="size-12 rounded object-contain" />}
        <div>
          <p className="font-bold text-slate-950">{s.branding.companyName || "Your company"}</p>
          <p className="text-xs text-slate-500">{s.branding.phone}{s.branding.email ? ` · ${s.branding.email}` : ""}</p>
        </div>
      </div>

      <header className="py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#eef3ec] px-2.5 py-1 text-xs font-bold uppercase text-(--color-secondary-text-icon)">{LIFECYCLE_LABEL[s.lifecycle] ?? s.lifecycle}</span>
          {s.currentStage && <span className="text-sm text-slate-600">{s.currentStage}</span>}
        </div>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{s.title || "Your project"}</h1>
        {s.customerSummary && <p className="mt-3 text-sm leading-7 text-slate-700">{s.customerSummary}</p>}
        {(s.plannedStartDate || s.targetCompletionDate) && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
            {s.plannedStartDate && <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" />Planned start: {new Date(s.plannedStartDate).toLocaleDateString()}</span>}
            {s.targetCompletionDate && <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" />Planned completion: {new Date(s.targetCompletionDate).toLocaleDateString()}</span>}
          </div>
        )}
        {s.location && <p className="mt-1 text-xs text-slate-500">{s.location}</p>}
      </header>

      {s.milestones.length > 0 && (
        <section className="border-t border-slate-200 py-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-950">Milestones</h2><p className="text-sm font-semibold text-slate-600">{milestoneCompletion.completed} of {milestoneCompletion.total} milestones completed</p></div>
          <ul className="mt-4 space-y-3">
            {s.milestones.map((m) => (
              <li key={m.id} className="flex items-start gap-3">
                <CheckCircle2 className={`mt-0.5 size-5 shrink-0 ${m.status === "COMPLETED" ? "text-(--color-secondary-text-icon)" : "text-slate-300"}`} />
                <div>
                  <p className={`text-sm font-semibold ${m.status === "COMPLETED" ? "text-slate-900" : "text-slate-600"}`}>{m.title}</p>
                  {m.description && <p className="text-xs text-slate-500">{m.description}</p>}
                  {(m.plannedDate || m.completedDate) && <p className="text-xs text-slate-400">{m.completedDate ? `Completed ${new Date(m.completedDate).toLocaleDateString()}` : m.plannedDate ? `Planned ${new Date(m.plannedDate).toLocaleDateString()}` : ""}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {s.nextPlannedActivity && (
        <section className="border-t border-slate-200 py-6">
          <h2 className="text-lg font-bold text-slate-950">What&apos;s next</h2>
          <p className="mt-2 text-sm leading-7 text-slate-700">{s.nextPlannedActivity}</p>
        </section>
      )}

      <section className="border-t border-slate-200 py-6">
        <h2 className="text-lg font-bold text-slate-950">Progress updates</h2>
        {updates.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No updates have been published yet.</p>
        ) : (
          <div className="mt-4 space-y-8">
            {updates.map((u) => (
              <article key={u.id} className="rounded-lg border border-slate-200 p-5">
                <time className="text-xs font-bold uppercase tracking-wide text-slate-400">{new Date(u.updateDate).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</time>
                <h3 className="mt-1 text-lg font-bold text-slate-950">{u.title}</h3>
                {u.workCompleted && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{u.workCompleted}</p>}
                {u.workInProgress && <p className="mt-2 text-xs font-semibold uppercase text-slate-400">In progress</p>}
                {u.workInProgress && <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{u.workInProgress}</p>}
                {u.issueNote && <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{u.issueNote}</p>}
                {u.photos.length > 0 && <div className="mt-4"><PhotoLightbox photos={u.photos} /></div>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 py-6">
        <h2 className="text-lg font-bold text-slate-950">Questions about your project?</h2>
        <p className="mt-2 text-sm text-slate-600">Get in touch directly with {s.branding.companyName || "the team"}.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {s.branding.phone && <a href={`tel:${s.branding.phone}`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Phone className="size-4" />{s.branding.phone}</a>}
          {s.branding.email && <a href={`mailto:${s.branding.email}`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Mail className="size-4" />{s.branding.email}</a>}
        </div>
      </section>
    </>
  );
}
