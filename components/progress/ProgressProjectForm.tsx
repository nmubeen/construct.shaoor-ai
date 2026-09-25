"use client";

import { useActionState } from "react";
import type { ProgressProject } from "@prisma/construct-client";

import { createProgressProjectAction, updateProgressProjectAction } from "@/lib/actions/construct-progress.actions";

const input = "mt-1.5 w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#7D9D76] focus:ring-4 focus:ring-[#7D9D76]/25";
const Hint = ({ children }: { children: React.ReactNode }) => <span className="mt-1 block text-xs font-normal text-slate-500">{children}</span>;
const Label = ({ text, hint, children, wide = false }: { text: string; hint?: React.ReactNode; children: React.ReactNode; wide?: boolean }) => (
  <label className={`text-sm font-semibold text-slate-700 ${wide ? "md:col-span-2" : ""}`}>{text}{hint && <Hint>{hint}</Hint>}{children}</label>
);

function toDateInputValue(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function ProgressProjectForm({
  project,
  linkCandidates,
}: {
  project?: ProgressProject;
  linkCandidates: {
    enquiries: { id: string; name: string; subject: string | null; createdAt: Date }[];
    proposals: { id: string; reference: string; title: string }[];
    portfolioProjects: { id: string; title: string }[];
  };
}) {
  const [state, formAction] = useActionState(project ? updateProgressProjectAction : createProgressProjectAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {project && <input type="hidden" name="id" value={project.id} />}
      {state?.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-(image:--gradient-form-bg) p-6 shadow-sm md:grid-cols-2">
        <h2 className="font-bold text-(--color-primary-text) md:col-span-2">Project details</h2>
        <Label text="Project title" hint="Internal reference — shown to staff, not necessarily the customer.">
          <input className={input} name="title" defaultValue={project?.title} required minLength={2} maxLength={200} />
        </Label>
        <Label text="Customer display name" hint="Shown on the customer's own page and used throughout the dashboard.">
          <input className={input} name="customerName" defaultValue={project?.customerName} required maxLength={200} />
        </Label>
        <Label text="Customer email" hint="Private — never shown on the customer page. Optional.">
          <input className={input} type="email" name="customerEmail" defaultValue={project?.customerEmail ?? ""} maxLength={320} />
        </Label>
        <Label text="Customer phone" hint="Private — never shown on the customer page. Optional.">
          <input className={input} name="customerPhone" defaultValue={project?.customerPhone ?? ""} maxLength={40} />
        </Label>
        <Label text="Location" hint="Site address or area. Optional.">
          <input className={input} name="location" defaultValue={project?.location ?? ""} maxLength={300} />
        </Label>
        <label className="flex items-start gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" name="locationCustomerVisible" defaultChecked={project?.locationCustomerVisible} className="mt-0.5" />
          <span>Show location to the customer<span className="block text-xs font-normal text-slate-500">Off by default — a site address is only shown on the customer page if explicitly turned on.</span></span>
        </label>
        <Label text="Customer-facing summary" wide hint="A short description of the project, shown to the customer.">
          <textarea className={`${input} min-h-24`} name="customerSummary" defaultValue={project?.customerSummary} maxLength={4000} />
        </Label>
        <Label text="Internal notes" wide hint="Staff-only — never shown to the customer or included on the published page.">
          <textarea className={`${input} min-h-24 bg-amber-50`} name="internalNotes" defaultValue={project?.internalNotes ?? ""} maxLength={4000} />
        </Label>
      </section>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-(image:--gradient-form-bg) p-6 shadow-sm md:grid-cols-2">
        <h2 className="font-bold text-(--color-primary-text) md:col-span-2">Stage &amp; dates</h2>
        <Label text="Lifecycle" hint={project ? "Change from the project workspace instead — kept in sync with access." : "New projects start as Planned."}>
          <input className={`${input} bg-slate-100`} value={project?.lifecycle ?? "PLANNED"} disabled readOnly />
        </Label>
        <Label text="Current stage" hint="Short free text, e.g. &quot;Foundation work&quot;. Optional.">
          <input className={input} name="currentStage" defaultValue={project?.currentStage ?? ""} maxLength={200} />
        </Label>
        <Label text="Planned start date" hint="Presented to the customer as planned, not a guarantee. Optional.">
          <input className={input} type="date" name="plannedStartDate" defaultValue={toDateInputValue(project?.plannedStartDate)} />
        </Label>
        <Label text="Target completion date" hint="Presented to the customer as planned, not a guarantee. Optional.">
          <input className={input} type="date" name="targetCompletionDate" defaultValue={toDateInputValue(project?.targetCompletionDate)} />
        </Label>
        <Label text="Next planned activity" wide hint="What happens next — shown on the customer page. Optional.">
          <textarea className={`${input} min-h-20`} name="nextPlannedActivity" defaultValue={project?.nextPlannedActivity ?? ""} maxLength={500} />
        </Label>
      </section>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-(image:--gradient-form-bg) p-6 shadow-sm md:grid-cols-3">
        <h2 className="font-bold text-(--color-primary-text) md:col-span-3">Optional links</h2>
        <p className="text-xs text-slate-500 md:col-span-3">Purely for staff traceability — linking never publishes or exposes anything from the linked record.</p>
        <Label text="Enquiry">
          <select className={input} name="enquiryId" defaultValue={project?.enquiryId ?? ""}>
            <option value="">— None —</option>
            {linkCandidates.enquiries.map((e) => <option key={e.id} value={e.id}>{e.subject || e.name}</option>)}
          </select>
        </Label>
        <Label text="Proposal">
          <select className={input} name="proposalId" defaultValue={project?.proposalId ?? ""}>
            <option value="">— None —</option>
            {linkCandidates.proposals.map((p) => <option key={p.id} value={p.id}>{p.reference} — {p.title}</option>)}
          </select>
        </Label>
        <Label text="Portfolio project">
          <select className={input} name="portfolioProjectId" defaultValue={project?.portfolioProjectId ?? ""}>
            <option value="">— None —</option>
            {linkCandidates.portfolioProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </Label>
      </section>

      <div className="sticky bottom-4 flex justify-end rounded-lg border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <button className="rounded-md bg-(image:--gradient-button-bg) px-6 py-3 text-sm font-semibold text-white">{project ? "Save changes" : "Create project"}</button>
      </div>
    </form>
  );
}
