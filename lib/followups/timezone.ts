// Timezone helpers for follow-up reminders. Deliberately NOT
// "server-only" — the same wall-clock <-> UTC conversion is needed both
// server-side (parsing a submitted due date/time, computing overdue/
// due-today boundaries in queries) and client-side (showing the actual
// resulting date/time before saving, per the feature's own requirement
// not to silently assign midnight or an unclear timezone). Every
// Date this module produces is a real UTC instant — "the org's
// timezone" only ever affects which wall-clock string that instant is
// derived from or displayed as, never how it's stored.

export const DEFAULT_ORG_TIMEZONE = "Asia/Kolkata";

export function isValidTimezone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

const WALL_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function formatPartsAsRecord(date: Date, timeZone: string, extra: Intl.DateTimeFormatOptions = {}): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...extra,
  }).formatToParts(date);
  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});
}

// Converts a naive "YYYY-MM-DDTHH:mm" wall-clock string — exactly what a
// <input type="date"> + <input type="time"> pair produces — into the
// real UTC instant it represents IN the given IANA zone (never the
// browser's or server's own local zone). Two passes of the standard
// formatToParts round-trip technique: the first guess can be off by a
// zone's UTC offset (including a DST delta right at a transition
// boundary), the second corrects for it and converges.
export function zonedWallTimeToUtc(wallTime: string, timeZone: string): Date {
  const match = WALL_TIME_RE.exec(wallTime);
  if (!match) throw new Error(`Invalid wall-clock time "${wallTime}" — expected YYYY-MM-DDTHH:mm.`);
  const [, yearStr, monthStr, dayStr, hourStr, minuteStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  let guess = targetAsUtc;
  for (let i = 0; i < 2; i++) {
    const parts = formatPartsAsRecord(new Date(guess), timeZone);
    const renderedAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) === 24 ? 0 : Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const delta = targetAsUtc - renderedAsUtc;
    if (delta === 0) break;
    guess += delta;
  }
  return new Date(guess);
}

// The inverse: what wall-clock date and time does a UTC instant show as
// in the given zone — used to pre-fill an edit form's date/time inputs
// and to compute "today" in the org's own zone.
export function utcToWallTimeParts(date: Date, timeZone: string): { date: string; time: string } {
  const parts = formatPartsAsRecord(date, timeZone);
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

// Pure calendar-date arithmetic (no timezone involved — a "day" here is
// just a date string) used to build the Tomorrow / In 3 days / Next week
// shortcuts and the today/tomorrow query boundary.
export function addDaysToWallDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

// [startOfToday, startOfTomorrow) in the org's own zone — the exact
// boundary "Due today" filters and the overview's due-today count use.
// Never derived from the server's local midnight.
export function getTodayBoundsInZone(timeZone: string, now: Date = new Date()): { startOfToday: Date; startOfTomorrow: Date } {
  const { date: todayDate } = utcToWallTimeParts(now, timeZone);
  const startOfToday = zonedWallTimeToUtc(`${todayDate}T00:00`, timeZone);
  const startOfTomorrow = zonedWallTimeToUtc(`${addDaysToWallDate(todayDate, 1)}T00:00`, timeZone);
  return { startOfToday, startOfTomorrow };
}

export type DueDateShortcut = { key: string; label: string; wallTime: string };

// Default hour chosen for a shortcut's suggested time (09:00, the start
// of a typical working day) — always shown back to the user as an
// editable, explicit date+time before saving, never applied silently.
const SHORTCUT_HOUR = "09:00";

export function computeDueDateShortcuts(timeZone: string, now: Date = new Date()): DueDateShortcut[] {
  const { date: todayDate } = utcToWallTimeParts(now, timeZone);
  return [
    { key: "tomorrow", label: "Tomorrow", wallTime: `${addDaysToWallDate(todayDate, 1)}T${SHORTCUT_HOUR}` },
    { key: "in-3-days", label: "In 3 days", wallTime: `${addDaysToWallDate(todayDate, 3)}T${SHORTCUT_HOUR}` },
    { key: "next-week", label: "Next week", wallTime: `${addDaysToWallDate(todayDate, 7)}T${SHORTCUT_HOUR}` },
  ];
}

// Human display of a UTC instant in the org's own zone — every follow-up
// due date/time shown anywhere in the dashboard goes through this
// (never a bare `.toLocaleString()`, which would silently use the
// server's or browser's own zone instead of the organization's).
//
// The locale is pinned to "en-GB" rather than left as `undefined` —
// `FollowUpManager`/`FollowUpDashboardList` are Client Components that
// get server-rendered (SSR) using this function and then re-rendered on
// hydration: `undefined` resolves to whatever default locale each
// environment happens to have (Node's server locale vs. the browser's,
// e.g. 24-hour "21:21" vs. 12-hour "9:21 pm"), which is exactly the
// mismatch React's hydration check flags — caught live via a temporary
// test route, see this feature's deployment note. A fixed locale makes
// the server- and client-rendered text byte-identical regardless of
// where either one runs.
const DISPLAY_LOCALE = "en-GB";

export function formatZonedDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone }).format(date);
}

export function formatZonedDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, { dateStyle: "medium", timeZone }).format(date);
}
