"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus } from "lucide-react";
import type { ProgressMilestone } from "@prisma/construct-client";

import { addMilestoneAction, reorderMilestonesAction, updateMilestoneAction } from "@/lib/actions/construct-progress.actions";

const input = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

const STATUS_STYLE: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-[#eef3ec] text-(--color-secondary-text-icon)",
};

function useCloseOnSuccess(state: { error: string } | null, isPending: boolean, onDone: () => void) {
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) onDone();
    wasPending.current = isPending;
  }, [isPending, state, onDone]);
}

function MilestoneFields({ milestone }: { milestone?: ProgressMilestone }) {
  return (
    <>
      <input name="title" required minLength={2} maxLength={200} defaultValue={milestone?.title} placeholder="Milestone title" className={input} />
      <textarea name="description" defaultValue={milestone?.description ?? ""} maxLength={2000} placeholder="Customer-facing description (optional)" rows={2} className={`${input} mt-2`} />
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <select name="status" defaultValue={milestone?.status ?? "NOT_STARTED"} className={input}>
          <option value="NOT_STARTED">Not started</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <input type="date" name="plannedDate" defaultValue={milestone?.plannedDate ? milestone.plannedDate.toISOString().slice(0, 10) : ""} className={input} title="Planned date" />
        <input type="date" name="completedDate" defaultValue={milestone?.completedDate ? milestone.completedDate.toISOString().slice(0, 10) : ""} className={input} title="Actual completion date" />
      </div>
    </>
  );
}

function EditMilestoneForm({ milestone, onDone }: { milestone: ProgressMilestone; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(updateMilestoneAction, null);
  useCloseOnSuccess(state, isPending, onDone);
  return (
    <form action={formAction} className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="id" value={milestone.id} />
      {state?.error && <p role="alert" className="text-xs text-red-600">{state.error}</p>}
      <MilestoneFields milestone={milestone} />
      <div className="flex gap-2">
        <button className="rounded-md bg-(image:--gradient-button-bg) px-3 py-2 text-xs font-semibold text-white">Save changes</button>
        <button type="button" onClick={onDone} className="rounded-md px-3 py-2 text-xs font-semibold text-slate-500">Cancel</button>
      </div>
    </form>
  );
}

export function MilestoneManager({ projectId, milestones, canEdit }: { projectId: string; milestones: ProgressMilestone[]; canEdit: boolean }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState(milestones);
  const [error, setError] = useState("");
  const [, startSaving] = useTransition();
  const savedOrder = useRef(milestones.map((m) => m.id));

  const completed = items.filter((m) => m.status === "COMPLETED").length;

  function persist(next: ProgressMilestone[]) {
    const ids = next.map((m) => m.id);
    if (ids.join() === savedOrder.current.join()) return;
    setError("");
    startSaving(async () => {
      const result = await reorderMilestonesAction(projectId, ids);
      if (result.error) {
        setError(result.error);
        setItems((current) => savedOrder.current.flatMap((id) => current.filter((m) => m.id === id)));
      } else {
        savedOrder.current = ids;
      }
    });
  }

  function moveBy(index: number, offset: -1 | 1) {
    const next = [...items];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setItems(next);
    persist(next);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">{completed} of {items.length} milestone{items.length === 1 ? "" : "s"} completed</p>
        {canEdit && !adding && <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Plus className="size-3.5" />Add milestone</button>}
      </div>
      {error && <p role="alert" className="mb-2 text-xs text-red-600">{error}</p>}

      {adding && (
        <form action={addMilestoneAction} className="mb-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <input type="hidden" name="projectId" value={projectId} />
          <MilestoneFields />
          <div className="flex gap-2">
            <button className="rounded-md bg-(image:--gradient-button-bg) px-3 py-2 text-xs font-semibold text-white">Add milestone</button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-md px-3 py-2 text-xs font-semibold text-slate-500">Cancel</button>
          </div>
        </form>
      )}

      {items.length === 0 && !adding ? (
        <p className="text-sm text-slate-500">No milestones yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((m, index) => (
            <li key={m.id} className="rounded-md border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2">
                {canEdit && (
                  <div className="flex shrink-0 flex-col">
                    <button type="button" disabled={index === 0} onClick={() => moveBy(index, -1)} className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move up"><ChevronUp className="size-4" /></button>
                    <button type="button" disabled={index === items.length - 1} onClick={() => moveBy(index, 1)} className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move down"><ChevronDown className="size-4" /></button>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[m.status]}`}>{m.status.replace("_", " ")}</span>
                    <p className="font-semibold text-slate-800">{m.title}</p>
                  </div>
                  {/* Locale pinned to "en-GB" (not left as the environment default) — this
                      is a Client Component that gets SSR-then-hydrated; an unpinned
                      locale renders differently in Node (SSR) vs the browser (hydration),
                      which is exactly the class of hydration-mismatch bug this codebase
                      hit before (see lib/followups/timezone.ts's own comment). */}
                  {m.plannedDate && <p className="mt-0.5 text-xs text-slate-500">Planned {m.plannedDate.toLocaleDateString("en-GB")}{m.completedDate ? ` · Completed ${m.completedDate.toLocaleDateString("en-GB")}` : ""}</p>}
                </div>
                {canEdit && <button type="button" onClick={() => setEditingId(editingId === m.id ? null : m.id)} className="shrink-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Pencil className="size-3.5" /></button>}
              </div>
              {editingId === m.id && <EditMilestoneForm milestone={m} onDone={() => setEditingId(null)} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
