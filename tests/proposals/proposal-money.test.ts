import { describe, expect, it } from "vitest";

import { formatMoney, minorUnitsToRupees, rupeesToMinorUnits } from "@/lib/proposal-money";

describe("rupeesToMinorUnits", () => {
  it("converts a plain rupee amount to integer paise", () => {
    expect(rupeesToMinorUnits("1500")).toBe(150000);
  });

  it("converts a decimal rupee amount to integer paise without float drift", () => {
    expect(rupeesToMinorUnits("1500.50")).toBe(150050);
    expect(rupeesToMinorUnits("0.10")).toBe(10);
    // The classic float trap (0.1 + 0.2 !== 0.3) — this must not appear here.
    expect(rupeesToMinorUnits("19.99")).toBe(1999);
  });

  it("rejects negative, empty, non-numeric or overly precise input", () => {
    expect(rupeesToMinorUnits("-100")).toBeNull();
    expect(rupeesToMinorUnits("")).toBeNull();
    expect(rupeesToMinorUnits("abc")).toBeNull();
    expect(rupeesToMinorUnits("10.999")).toBeNull();
  });
});

describe("minorUnitsToRupees / formatMoney round-trip", () => {
  it("round-trips through minor units without drift", () => {
    const minor = rupeesToMinorUnits("123456.78");
    expect(minor).not.toBeNull();
    expect(minorUnitsToRupees(minor!)).toBe("123456.78");
  });

  it("formats as INR currency", () => {
    expect(formatMoney(150000, "INR")).toContain("1,500");
  });
});
