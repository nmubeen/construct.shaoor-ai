// Money for a proposal's price is stored as an integer in minor units
// (paise for INR) — the only money-representation precedent anywhere in
// this system (control.plans.price_amount uses the same convention) —
// specifically to avoid float rounding drift. These helpers are the only
// place minor-unit <-> major-unit conversion happens.

export function rupeesToMinorUnits(rupees: string): number | null {
  const trimmed = rupees.trim();
  if (!trimmed || !/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(paise) && paise >= 0 ? paise : null;
}

export function minorUnitsToRupees(minor: number): string {
  return (minor / 100).toFixed(2).replace(/\.00$/, "");
}

export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2, minimumFractionDigits: minor % 100 === 0 ? 0 : 2 }).format(minor / 100);
}
