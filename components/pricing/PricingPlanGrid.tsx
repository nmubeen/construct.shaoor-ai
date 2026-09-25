"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import type { ConstructControlPlan } from "@/lib/services/construct-plan-catalog.service";

// Groups control.plans rows that only differ by billing frequency (code
// ending _MONTHLY/_ANNUAL, e.g. STARTER_MONTHLY + STARTER_ANNUAL) into one
// card with a Monthly/Annual toggle, instead of listing every interval as
// its own card — the naming convention control.plans already uses for
// every paired plan (see app/pricing/page.tsx), not something inferred
// from price or feature content. A plan with no such suffix (FREE) renders
// as its own single-price card and simply ignores the toggle.
export type PricingFamily = {
  key: string;
  displayName: string;
  isTopTier: boolean;
  sortOrder: number;
  monthly: ConstructControlPlan | null;
  annual: ConstructControlPlan | null;
  /** Set only for a plan with no _MONTHLY/_ANNUAL pair at all (e.g. FREE). */
  single: ConstructControlPlan | null;
};

const money = (rupees: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(rupees);

function annualSavingsPercent(family: PricingFamily): number | null {
  if (!family.monthly?.priceMonthlyInr || !family.annual?.priceMonthlyInr) return null;
  const payAsYouGo = family.monthly.priceMonthlyInr * 12;
  const annual = family.annual.priceMonthlyInr;
  if (payAsYouGo <= 0 || annual >= payAsYouGo) return null;
  return Math.round((1 - annual / payAsYouGo) * 100);
}

export function PricingPlanGrid({ families, trialDays }: { families: PricingFamily[]; trialDays: number | null }) {
  const [interval, setInterval] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const hasAnyPair = families.some((family) => family.monthly && family.annual);
  // Representative savings badge on the toggle itself: every paired family
  // in the current catalog discounts annual by roughly the same amount, so
  // one number on the switch reads cleaner than repeating a slightly
  // different percentage on each card. Falls back to the first computable
  // family's figure rather than an average, so it's always a real,
  // currently-true number instead of a blended one nobody's actually paying.
  const representativeSavings = families.map(annualSavingsPercent).find((value) => value !== null) ?? null;

  return (
    <>
      {hasAnyPair && (
        <div className="mb-10 flex justify-center">
          <div role="radiogroup" aria-label="Billing frequency" className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {(["MONTHLY", "ANNUAL"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={interval === option}
                onClick={() => setInterval(option)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${interval === option ? "bg-(image:--gradient-button-bg) text-white" : "text-slate-600 hover:text-slate-950"}`}
              >
                {option === "MONTHLY" ? "Monthly" : "Annual"}
                {option === "ANNUAL" && representativeSavings !== null && (
                  <span className={`ml-1.5 ${interval === "ANNUAL" ? "text-white/80" : "text-(--color-secondary-text-icon)"}`}>Save {representativeSavings}%</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {families.map((family) => {
          // Falls back to whatever the family actually has if the globally
          // selected interval isn't offered for it, rather than hiding the
          // card or leaving it blank.
          const shown = family.single ?? (interval === "ANNUAL" ? family.annual ?? family.monthly : family.monthly ?? family.annual);
          if (!shown) return null;
          const savings = interval === "ANNUAL" ? annualSavingsPercent(family) : null;

          return (
            <article
              key={family.key}
              className={`relative flex flex-col rounded-lg border bg-white p-6 shadow-[0_8px_24px_rgba(9,65,54,.06)] ${family.isTopTier ? "border-[#7D9D76] ring-2 ring-[#7D9D76]" : "border-slate-200"}`}
            >
              {family.isTopTier && (
                <div className="absolute -top-3 left-6 rounded-full bg-(image:--gradient-secondary-bg) px-3 py-1 text-[11px] font-bold uppercase tracking-[.08em] text-white">
                  Most popular
                </div>
              )}
              <h2 className="text-lg font-bold text-(--color-primary-text)">{family.displayName}</h2>
              <p className="mt-1 font-mono text-2xl font-bold">
                {shown.priceMonthlyInr ? money(shown.priceMonthlyInr) : "Free"}
                {shown.priceMonthlyInr ? <span className="text-xs font-normal text-slate-500">/{shown.billingInterval === "ANNUAL" ? "yr" : "mo"}</span> : null}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {shown.priceMonthlyInr
                  ? `Billed ${shown.billingInterval === "ANNUAL" ? "annually" : "monthly"}${trialDays ? `, after a ${trialDays}-day trial` : ""}${savings ? ` · save ${savings}% vs monthly` : ""}`
                  : "Free forever"}
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm">
                {shown.featureLines.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-(--color-secondary-text-icon)" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/account/login"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-(image:--gradient-button-bg) px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Start free trial <ArrowRight className="size-4" />
              </Link>
            </article>
          );
        })}
      </div>
    </>
  );
}
