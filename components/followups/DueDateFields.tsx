"use client";

import { useState } from "react";

import { computeDueDateShortcuts, formatZonedDateTime, zonedWallTimeToUtc } from "@/lib/followups/timezone";

const input = "rounded-md border border-slate-300 px-3 py-2 text-sm";

// Shared date+time picker for every place a follow-up's due moment is
// chosen or changed (schedule form, edit form, quick reschedule,
// complete-and-schedule-next) — always shows the actual resulting
// date/time in the organization's own timezone before saving (never a
// silent midnight or an unlabeled/ambiguous zone), and a past-due
// warning that's advisory only, never a block: an intentionally chosen
// past time is allowed through unchanged.
export function DueDateFields({ namePrefix, timezone, defaultDate = "", defaultTime = "09:00", onChange }: { namePrefix: string; timezone: string; defaultDate?: string; defaultTime?: string; onChange?: (wallTime: string) => void }) {
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const shortcuts = computeDueDateShortcuts(timezone);

  function update(nextDate: string, nextTime: string) {
    setDate(nextDate);
    setTime(nextTime);
    if (onChange && nextDate && nextTime) onChange(`${nextDate}T${nextTime}`);
  }

  let preview: string | null = null;
  let isPast = false;
  if (date && time) {
    try {
      const dueAt = zonedWallTimeToUtc(`${date}T${time}`, timezone);
      preview = formatZonedDateTime(dueAt, timezone);
      // eslint-disable-next-line react-hooks/purity -- the past-due warning is inherently time-relative; no pure alternative exists, and this component isn't compiled by React Compiler (not enabled in next.config.ts).
      isPast = dueAt.getTime() < Date.now();
    } catch {
      preview = null;
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {shortcuts.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              const [d, t] = s.wallTime.split("T");
              update(d, t);
            }}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <input type="date" name={`${namePrefix}Date`} value={date} onChange={(e) => update(e.target.value, time)} required className={input} />
        <input type="time" name={`${namePrefix}Time`} value={time} onChange={(e) => update(date, e.target.value)} required className={input} />
      </div>
      {preview && (
        <p className={`text-xs ${isPast ? "font-semibold text-amber-700" : "text-slate-500"}`} role={isPast ? "alert" : undefined}>
          {isPast ? "⚠ This is in the past — " : "Due "}
          {preview} <span className="text-slate-400">({timezone})</span>
        </p>
      )}
    </div>
  );
}
