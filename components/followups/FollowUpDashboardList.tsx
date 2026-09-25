"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CalendarClock, CheckCircle2, FileText, Mail, XCircle } from "lucide-react";

import { cancelFollowUpAction, completeFollowUpAction, quickRescheduleFollowUpAction } from "@/lib/actions/construct-followup.actions";
import { formatZonedDateTime, utcToWallTimeParts } from "@/lib/followups/timezone";

import { DueDateFields } from "./DueDateFields";

export type DashboardFollowUpRow = {
  id: string;
  title: string;
  dueAt: Date;
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  assigneeName: string | null;
  assigneeNeedsReassignment: boolean;
  parentType: "ENQUIRY" | "PROPOSAL";
  parentHref: string;
  customerName: string;
  parentLabel: string;
};

function displayStatus(row: DashboardFollowUpRow): "OVERDUE" | "OPEN" | "COMPLETED" | "CANCELLED" {
  if (row.status === "OPEN" && row.dueAt.getTime() < Date.now()) return "OVERDUE";
  return row.status;
}

const STATUS_STYLE: Record<string, string> = {
  OVERDUE: "bg-red-50 text-red-700",
  OPEN: "bg-slate-100 text-slate-600",
  COMPLETED: "bg-[#eef3ec] text-(--color-secondary-text-icon)",
  CANCELLED: "bg-slate-100 text-slate-400",
};

function QuickRow({ row, timezone, canEdit }: { row: DashboardFollowUpRow; timezone: string; canEdit: boolean }) {
  const [mode, setMode] = useState<"view" | "complete" | "reschedule">("view");
  const [outcomeNote, setOutcomeNote] = useState("");
  const initialWallTime = utcToWallTimeParts(row.dueAt, timezone);
  const [wallTime, setWallTime] = useState(`${initialWallTime.date}T${initialWallTime.time}`);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const status = displayStatus(row);
  const isOpen = row.status === "OPEN";

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[status]}`}>{status}</span>
            <p className="font-semibold text-slate-800">{row.title}</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isOpen ? "Due " : "Was due "}{formatZonedDateTime(row.dueAt, timezone)}
            {" · "}{row.assigneeNeedsReassignment ? <span className="font-semibold text-amber-700">Needs reassignment</span> : row.assigneeName ?? "Unassigned"}
          </p>
          <Link href={row.parentHref} className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-(--color-secondary-text-icon) hover:underline">
            {row.parentType === "PROPOSAL" ? <FileText className="size-3.5" /> : <Mail className="size-3.5" />}
            {row.customerName} · {row.parentLabel}
          </Link>
        </div>
        {canEdit && isOpen && mode === "view" && (
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <button type="button" onClick={() => setMode("complete")} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><CheckCircle2 className="size-3.5" />Complete</button>
            <button type="button" onClick={() => setMode("reschedule")} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><CalendarClock className="size-3.5" />Reschedule</button>
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
      {mode === "complete" && (
        <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <label className="block text-xs font-semibold text-slate-600">Outcome (optional)<textarea value={outcomeNote} onChange={(e) => setOutcomeNote(e.target.value)} rows={2} maxLength={2000} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(async () => {
                const result = await completeFollowUpAction(row.id, outcomeNote);
                if (result.error) setError(result.error);
                else setMode("view");
              })}
              className="rounded-md bg-(image:--gradient-button-bg) px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              Mark complete
            </button>
            <Link href={row.parentHref} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white">Complete &amp; schedule next…</Link>
            <button type="button" onClick={() => setMode("view")} className="rounded-md px-3 py-2 text-xs font-semibold text-slate-500">Cancel</button>
          </div>
        </div>
      )}
      {mode === "reschedule" && (
        <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <DueDateFields namePrefix="reschedule" timezone={timezone} defaultDate={utcToWallTimeParts(row.dueAt, timezone).date} defaultTime={utcToWallTimeParts(row.dueAt, timezone).time} onChange={setWallTime} />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || !wallTime}
              onClick={() => startTransition(async () => {
                const result = await quickRescheduleFollowUpAction(row.id, wallTime);
                if (result.error) setError(result.error);
                else setMode("view");
              })}
              className="rounded-md bg-(image:--gradient-button-bg) px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              Save new due time
            </button>
            <button type="button" onClick={() => setMode("view")} className="rounded-md px-3 py-2 text-xs font-semibold text-slate-500">Cancel</button>
          </div>
        </div>
      )}
    </li>
  );
}

export function FollowUpDashboardList({ rows, timezone, canEdit }: { rows: DashboardFollowUpRow[]; timezone: string; canEdit: boolean }) {
  if (rows.length === 0) return null;
  return (
    <ul className="space-y-2">
      {rows.map((row) => <QuickRow key={row.id} row={row} timezone={timezone} canEdit={canEdit} />)}
    </ul>
  );
}
