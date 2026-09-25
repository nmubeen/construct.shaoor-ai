import { describe, expect, it } from "vitest";

import {
  addDaysToWallDate,
  computeDueDateShortcuts,
  getTodayBoundsInZone,
  isValidTimezone,
  utcToWallTimeParts,
  zonedWallTimeToUtc,
} from "@/lib/followups/timezone";

describe("isValidTimezone", () => {
  it("accepts real IANA zones", () => {
    expect(isValidTimezone("Asia/Kolkata")).toBe(true);
    expect(isValidTimezone("America/New_York")).toBe(true);
    expect(isValidTimezone("UTC")).toBe(true);
  });
  it("rejects garbage input", () => {
    expect(isValidTimezone("Not/AZone")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
  });
});

describe("zonedWallTimeToUtc / utcToWallTimeParts round-trip", () => {
  it("a wall-clock time in IST converts to the correct UTC instant (IST = UTC+5:30, no DST)", () => {
    // 9:00 AM IST on 26 Sep 2026 is 3:30 AM UTC the same day.
    const utc = zonedWallTimeToUtc("2026-09-26T09:00", "Asia/Kolkata");
    expect(utc.toISOString()).toBe("2026-09-26T03:30:00.000Z");
  });

  it("round-trips back to the same wall-clock date and time", () => {
    const wallTime = "2026-12-01T14:45";
    const utc = zonedWallTimeToUtc(wallTime, "Asia/Kolkata");
    const back = utcToWallTimeParts(utc, "Asia/Kolkata");
    expect(`${back.date}T${back.time}`).toBe(wallTime);
  });

  it("handles a UTC-negative zone (US Eastern, EST = UTC-5 in winter)", () => {
    const utc = zonedWallTimeToUtc("2026-01-15T09:00", "America/New_York");
    expect(utc.toISOString()).toBe("2026-01-15T14:00:00.000Z");
  });

  it("handles the US spring-forward DST boundary correctly (2 AM -> 3 AM on 2026-03-08)", () => {
    // Before the transition: EST (UTC-5). 1:30 AM local -> 6:30 AM UTC.
    const before = zonedWallTimeToUtc("2026-03-08T01:30", "America/New_York");
    expect(before.toISOString()).toBe("2026-03-08T06:30:00.000Z");
    // After the transition: EDT (UTC-4). 3:30 AM local -> 7:30 AM UTC —
    // NOT 8:30, which is what a naive fixed-offset conversion would give.
    const after = zonedWallTimeToUtc("2026-03-08T03:30", "America/New_York");
    expect(after.toISOString()).toBe("2026-03-08T07:30:00.000Z");
  });

  it("handles the US fall-back DST boundary (an ambiguous hour still resolves to a definite instant)", () => {
    // 2026-11-01 is the fall-back date; 1:30 AM local is ambiguous (occurs
    // twice), but the conversion must still produce SOME valid, correctly
    // round-tripping UTC instant rather than throwing or drifting.
    const utc = zonedWallTimeToUtc("2026-11-01T01:30", "America/New_York");
    const back = utcToWallTimeParts(utc, "America/New_York");
    expect(back).toEqual({ date: "2026-11-01", time: "01:30" });
  });
});

describe("addDaysToWallDate", () => {
  it("adds calendar days without any timezone conversion", () => {
    expect(addDaysToWallDate("2026-09-25", 1)).toBe("2026-09-26");
    expect(addDaysToWallDate("2026-09-25", 3)).toBe("2026-09-28");
    expect(addDaysToWallDate("2026-09-25", 7)).toBe("2026-10-02");
  });
  it("crosses a year boundary correctly", () => {
    expect(addDaysToWallDate("2026-12-30", 3)).toBe("2027-01-02");
  });
});

describe("getTodayBoundsInZone", () => {
  it("IST midnight boundaries are UTC 18:30 the previous day, not UTC midnight", () => {
    const now = zonedWallTimeToUtc("2026-09-26T12:00", "Asia/Kolkata");
    const { startOfToday, startOfTomorrow } = getTodayBoundsInZone("Asia/Kolkata", now);
    expect(startOfToday.toISOString()).toBe("2026-09-25T18:30:00.000Z");
    expect(startOfTomorrow.toISOString()).toBe("2026-09-26T18:30:00.000Z");
  });

  it("a moment just before local midnight is NOT counted as tomorrow", () => {
    const justBeforeMidnight = zonedWallTimeToUtc("2026-09-26T23:59", "Asia/Kolkata");
    const { startOfTomorrow } = getTodayBoundsInZone("Asia/Kolkata", justBeforeMidnight);
    expect(justBeforeMidnight.getTime()).toBeLessThan(startOfTomorrow.getTime());
  });
});

describe("computeDueDateShortcuts", () => {
  it("produces Tomorrow / In 3 days / Next week relative to the org's own local date, not UTC's", () => {
    // 11:30 PM IST on 2026-09-25 is already 2026-09-26 in UTC — the
    // shortcuts must still be based on the IST calendar date (25th).
    const lateIstNight = zonedWallTimeToUtc("2026-09-25T23:30", "Asia/Kolkata");
    const shortcuts = computeDueDateShortcuts("Asia/Kolkata", lateIstNight);
    expect(shortcuts.find((s) => s.key === "tomorrow")?.wallTime).toBe("2026-09-26T09:00");
    expect(shortcuts.find((s) => s.key === "in-3-days")?.wallTime).toBe("2026-09-28T09:00");
    expect(shortcuts.find((s) => s.key === "next-week")?.wallTime).toBe("2026-10-02T09:00");
  });
});
