import { Clock } from "lucide-react";

import { formatZonedDateTime } from "@/lib/followups/timezone";

// Compact "next open follow-up" indicator for enquiry/proposal list
// rows — pure display, no interactivity needed, so this stays a plain
// (server-renderable) component rather than a client one.
export function NextFollowUpBadge({ dueAt, timezone }: { dueAt: Date | null; timezone: string }) {
  if (!dueAt) return null;
  // eslint-disable-next-line react-hooks/purity -- "is this overdue right now" is inherently time-relative; there's no pure alternative for it, and this component isn't compiled by React Compiler (not enabled in next.config.ts).
  const overdue = dueAt.getTime() < Date.now();
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${overdue ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`} title={`Next follow-up: ${formatZonedDateTime(dueAt, timezone)}`}>
      <Clock className="size-3" />
      {overdue ? "Overdue" : formatZonedDateTime(dueAt, timezone)}
    </span>
  );
}
