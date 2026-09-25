"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { CalendarClock, CheckCircle2, ChevronRight, Pencil, XCircle } from "lucide-react";

import {
  cancelFollowUpAction,
  completeAndScheduleNextFollowUpAction,
  completeFollowUpAction,
  createFollowUpAction,
  quickRescheduleFollowUpAction,
  updateFollowUpAction,
} from "@/lib/actions/construct-followup.actions";
import { formatZonedDateTime, utcToWallTimeParts } from "@/lib/followups/timezone";

import { DueDateFields } from "./DueDateFields";

const input = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

// Closes an inline panel exactly once, right after its useActionState
// form finishes submitting with no error — watching the pending ->
// not-pending transition rather than calling the action a second time
// just to read its result (which would risk a second, real submission).
function useCloseOnSuccess(state: { error: string } | null, isPending: boolean, onDone: () => void) {
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) onDone();
    wasPending.current = isPending;
  }, [isPending, state, onDone]);
}

export type FollowUpAssigneeOption = { id: string; name: string };

export type FollowUpRowData = {
  id: string;
  title: string;
  note: string | null;
  dueAt: Date;
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeNeedsReassignment: boolean;
  completedAt: Date | null;
  completedByName: string | null;
  outcomeNote: string | null;
};

function displayStatus(row: FollowUpRowData): "OVERDUE" | "OPEN" | "COMPLETED" | "CANCELLED" {
  if (row.status === "OPEN" && row.dueAt.getTime() < Date.now()) return "OVERDUE";
  return row.status;
}

const STATUS_STYLE: Record<string, string> = {
  OVERDUE: "bg-red-50 text-red-700",
  OPEN: "bg-slate-100 text-slate-600",
  COMPLETED: "bg-[#eef3ec] text-(--color-secondary-text-icon)",
  CANCELLED: "bg-slate-100 text-slate-400",
};

function AssigneeSelect({ name, assignees, defaultValue }: { name: string; assignees: FollowUpAssigneeOption[]; defaultValue?: string }) {
  return (
    <select name={name} defaultValue={defaultValue} className={input}>
      {assignees.map((a) => (
        <option key={a.id} value={a.id}>{a.name}</option>
      ))}
    </select>
  );
}

// Full create form — shown from a toggle so the section stays compact
// when there's nothing to schedule right now.
function ScheduleForm({ parentType, parentId, timezone, assignees, currentUserId, onDone }: { parentType: "ENQUIRY" | "PROPOSAL"; parentId: string; timezone: string; assignees: FollowUpAssigneeOption[]; currentUserId: string; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(createFollowUpAction, null);
  useCloseOnSuccess(state, isPending, onDone);
  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="parentType" value={parentType} />
      <input type="hidden" name="parentId" value={parentId} />
      {state?.error && <p role="alert" className="text-xs text-red-600">{state.error}</p>}
      <input name="title" required minLength={2} maxLength={140} placeholder="Action — e.g. Call about the site visit" className={input} />
      <textarea name="note" placeholder="Internal note (optional)" rows={2} maxLength={2000} className={input} />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">Assign to<AssigneeSelect name="assigneeId" assignees={assignees} defaultValue={currentUserId} /></label>
        <div className="text-xs font-semibold text-slate-600">Due<DueDateFields namePrefix="due" timezone={timezone} /></div>
      </div>
      <div className="flex gap-2">
        <button className="rounded-md bg-(image:--gradient-button-bg) px-3 py-2 text-xs font-semibold text-white">Schedule follow-up</button>
        <button type="button" onClick={onDone} className="rounded-md px-3 py-2 text-xs font-semibold text-slate-500">Cancel</button>
      </div>
    </form>
  );
}

function EditForm({ row, timezone, assignees, onDone }: { row: FollowUpRowData; timezone: string; assignees: FollowUpAssigneeOption[]; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(updateFollowUpAction, null);
  useCloseOnSuccess(state, isPending, onDone);
  const { date, time } = utcToWallTimeParts(row.dueAt, timezone);
  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="id" value={row.id} />
      {state?.error && <p role="alert" className="text-xs text-red-600">{state.error}</p>}
      <input name="title" required minLength={2} maxLength={140} defaultValue={row.title} className={input} />
      <textarea name="note" defaultValue={row.note ?? ""} rows={2} maxLength={2000} className={input} />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">Assign to<AssigneeSelect name="assigneeId" assignees={assignees} defaultValue={row.assigneeId ?? undefined} /></label>
        <div className="text-xs font-semibold text-slate-600">Due<DueDateFields namePrefix="due" timezone={timezone} defaultDate={date} defaultTime={time} /></div>
      </div>
      <div className="flex gap-2">
        <button className="rounded-md bg-(image:--gradient-button-bg) px-3 py-2 text-xs font-semibold text-white">Save changes</button>
        <button type="button" onClick={onDone} className="rounded-md px-3 py-2 text-xs font-semibold text-slate-500">Cancel</button>
      </div>
    </form>
  );
}

function ReschedulePanel({ id, timezone, row, onDone }: { id: string; timezone: string; row: FollowUpRowData; onDone: () => void }) {
  const { date, time } = utcToWallTimeParts(row.dueAt, timezone);
  const [wallTime, setWallTime] = useState(`${date}T${time}`);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <DueDateFields namePrefix="reschedule" timezone={timezone} defaultDate={date} defaultTime={time} onChange={setWallTime} />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => {
            const result = await quickRescheduleFollowUpAction(id, wallTime);
            if (result.error) setError(result.error);
            else onDone();
          })}
          className="rounded-md bg-(image:--gradient-button-bg) px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          Save new due time
        </button>
        <button type="button" onClick={onDone} className="rounded-md px-3 py-2 text-xs font-semibold text-slate-500">Cancel</button>
      </div>
    </div>
  );
}

function CompletePanel({ row, timezone, assignees, currentUserId, schedulingAllowed, onDone }: { row: FollowUpRowData; timezone: string; assignees: FollowUpAssigneeOption[]; currentUserId: string; schedulingAllowed: boolean; onDone: () => void }) {
  const [outcomeNote, setOutcomeNote] = useState("");
  const [scheduleNext, setScheduleNext] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [nextState, nextFormAction, isNextPending] = useActionState(completeAndScheduleNextFollowUpAction, null);
  useCloseOnSuccess(nextState, isNextPending, onDone);

  if (scheduleNext) {
    return (
      <form action={nextFormAction} className="mt-3 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <input type="hidden" name="id" value={row.id} />
        {nextState?.error && <p role="alert" className="text-xs text-red-600">{nextState.error}</p>}
        <label className="block text-xs font-semibold text-slate-600">Outcome of this follow-up (optional)
          <textarea name="outcomeNote" defaultValue={outcomeNote} rows={2} maxLength={2000} className={`${input} mt-1`} />
        </label>
        <div className="border-t border-slate-200 pt-3">
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Next follow-up</p>
          <input name="nextTitle" required minLength={2} maxLength={140} placeholder="Next action" className={input} />
          <textarea name="nextNote" placeholder="Note (optional)" rows={2} maxLength={2000} className={`${input} mt-2`} />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Assign to<AssigneeSelect name="nextAssigneeId" assignees={assignees} defaultValue={currentUserId} /></label>
            <div className="text-xs font-semibold text-slate-600">Due<DueDateFields namePrefix="nextDue" timezone={timezone} /></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md bg-(image:--gradient-button-bg) px-3 py-2 text-xs font-semibold text-white">Complete &amp; schedule next</button>
          <button type="button" onClick={() => setScheduleNext(false)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">Back</button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <label className="block text-xs font-semibold text-slate-600">Outcome (optional)
        <textarea value={outcomeNote} onChange={(e) => setOutcomeNote(e.target.value)} rows={2} maxLength={2000} className={`${input} mt-1`} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => {
            const result = await completeFollowUpAction(row.id, outcomeNote);
            if (result.error) setError(result.error);
            else onDone();
          })}
          className="rounded-md bg-(image:--gradient-button-bg) px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          Mark complete
        </button>
        {schedulingAllowed && (
          <button type="button" onClick={() => setScheduleNext(true)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white">
            Complete &amp; schedule next <ChevronRight className="size-3.5" />
          </button>
        )}
        <button type="button" onClick={onDone} className="rounded-md px-3 py-2 text-xs font-semibold text-slate-500">Cancel</button>
      </div>
    </div>
  );
}

function FollowUpRow({ row, timezone, assignees, currentUserId, canEdit, schedulingAllowed }: { row: FollowUpRowData; timezone: string; assignees: FollowUpAssigneeOption[]; currentUserId: string; canEdit: boolean; schedulingAllowed: boolean }) {
  const [mode, setMode] = useState<"view" | "edit" | "reschedule" | "complete">("view");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const status = displayStatus(row);
  const isOpen = row.status === "OPEN";

  return (
    <li className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[status]}`}>{status}</span>
            <p className="font-semibold text-slate-800">{row.title}</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isOpen ? "Due " : "Was due "}{formatZonedDateTime(row.dueAt, timezone)}
            {" · "}
            {row.assigneeNeedsReassignment ? <span className="font-semibold text-amber-700">Needs reassignment</span> : row.assigneeName ?? "Unassigned"}
          </p>
          {row.note && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{row.note}</p>}
          {row.status === "COMPLETED" && (
            <p className="mt-1 text-xs text-slate-500">
              Completed {row.completedAt ? formatZonedDateTime(row.completedAt, timezone) : ""}{row.completedByName ? ` by ${row.completedByName}` : ""}
              {row.outcomeNote ? ` — “${row.outcomeNote}”` : ""}
            </p>
          )}
        </div>
        {canEdit && isOpen && mode === "view" && (
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <button type="button" onClick={() => setMode("complete")} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><CheckCircle2 className="size-3.5" />Complete</button>
            <button type="button" onClick={() => setMode("reschedule")} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><CalendarClock className="size-3.5" />Reschedule</button>
            <button type="button" onClick={() => setMode("edit")} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Pencil className="size-3.5" />Edit</button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Cancel this follow-up?")) return;
                startTransition(async () => {
                  const result = await cancelFollowUpAction(row.id);
                  if (result.error) setError(result.error);
                });
              }}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              <XCircle className="size-3.5" />Cancel
            </button>
          </div>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      {mode === "edit" && <EditForm row={row} timezone={timezone} assignees={assignees} onDone={() => setMode("view")} />}
      {mode === "reschedule" && <ReschedulePanel id={row.id} timezone={timezone} row={row} onDone={() => setMode("view")} />}
      {mode === "complete" && <CompletePanel row={row} timezone={timezone} assignees={assignees} currentUserId={currentUserId} schedulingAllowed={schedulingAllowed} onDone={() => setMode("view")} />}
    </li>
  );
}

export function FollowUpManager({
  parentType,
  parentId,
  timezone,
  canEdit,
  schedulingAllowed,
  schedulingDisabledReason,
  currentUserId,
  assignees,
  followUps,
}: {
  parentType: "ENQUIRY" | "PROPOSAL";
  parentId: string;
  timezone: string;
  canEdit: boolean;
  schedulingAllowed: boolean;
  schedulingDisabledReason?: string;
  currentUserId: string;
  assignees: FollowUpAssigneeOption[];
  followUps: FollowUpRowData[];
}) {
  const [scheduling, setScheduling] = useState(false);
  const open = followUps.filter((f) => f.status === "OPEN");
  const closed = followUps.filter((f) => f.status !== "OPEN");

  return (
    <div>
      {canEdit && !scheduling && (
        schedulingAllowed ? (
          <button type="button" onClick={() => setScheduling(true)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">+ Schedule a follow-up</button>
        ) : (
          <p className="text-xs text-slate-500">{schedulingDisabledReason ?? "Scheduling new follow-ups is unavailable on the current plan."}</p>
        )
      )}
      {scheduling && <ScheduleForm parentType={parentType} parentId={parentId} timezone={timezone} assignees={assignees} currentUserId={currentUserId} onDone={() => setScheduling(false)} />}

      {followUps.length === 0 && !scheduling && <p className="mt-2 text-xs text-slate-500">No follow-ups yet. Reminders only appear in this dashboard — nothing is emailed or texted automatically.</p>}

      {(open.length > 0 || closed.length > 0) && (
        <ul className="mt-3 space-y-2">
          {[...open, ...closed].map((row) => (
            <FollowUpRow key={row.id} row={row} timezone={timezone} assignees={assignees} currentUserId={currentUserId} canEdit={canEdit} schedulingAllowed={schedulingAllowed} />
          ))}
        </ul>
      )}
    </div>
  );
}
