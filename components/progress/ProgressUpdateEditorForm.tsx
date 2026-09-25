"use client";

import { useActionState } from "react";
import type { ProgressMilestone, ProgressUpdate } from "@prisma/construct-client";

import { updateProgressUpdateAction } from "@/lib/actions/construct-progress.actions";

const input = "mt-1.5 w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#7D9D76] focus:ring-4 focus:ring-[#7D9D76]/25";
const Hint = ({ children }: { children: React.ReactNode }) => <span className="mt-1 block text-xs font-normal text-slate-500">{children}</span>;
const Label = ({ text, hint, children }: { text: string; hint?: React.ReactNode; children: React.ReactNode }) => <label className="text-sm font-semibold text-slate-700">{text}{hint && <Hint>{hint}</Hint>}{children}</label>;

export function ProgressUpdateEditorForm({ update, milestones, readOnly }: { update: ProgressUpdate; milestones: ProgressMilestone[]; readOnly: boolean }) {
  const [state, formAction] = useActionState(updateProgressUpdateAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={update.id} />
      {state?.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Label text="Update title"><input className={input} name="title" defaultValue={update.title} required minLength={2} maxLength={200} disabled={readOnly} /></Label>
        <Label text="Update date"><input className={input} type="date" name="updateDate" defaultValue={update.updateDate.toISOString().slice(0, 10)} required disabled={readOnly} /></Label>
      </div>

      <Label text="Work completed"><textarea className={`${input} min-h-28`} name="workCompleted" defaultValue={update.workCompleted} maxLength={4000} disabled={readOnly} /></Label>
      <Label text="Work in progress"><textarea className={`${input} min-h-24`} name="workInProgress" defaultValue={update.workInProgress} maxLength={4000} disabled={readOnly} /></Label>
      <Label text="Next planned activity"><textarea className={`${input} min-h-20`} name="nextPlannedActivity" defaultValue={update.nextPlannedActivity} maxLength={2000} disabled={readOnly} /></Label>
      <Label text="Issue or delay explanation" hint="Optional, customer-facing — be honest and brief."><textarea className={`${input} min-h-20`} name="issueNote" defaultValue={update.issueNote ?? ""} maxLength={2000} disabled={readOnly} /></Label>

      <Label text="Related milestone" hint="Optional.">
        <select className={input} name="milestoneId" defaultValue={update.milestoneId ?? ""} disabled={readOnly}>
          <option value="">— None —</option>
          {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </Label>

      {!readOnly && <div className="flex justify-end"><button className="rounded-md bg-(image:--gradient-button-bg) px-5 py-2.5 text-sm font-semibold text-white">Save draft</button></div>}
    </form>
  );
}
