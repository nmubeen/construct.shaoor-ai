import "server-only";

import { cache } from "react";

import { getConstructPrisma } from "@/lib/construct-prisma";

// Pricing/marketing fields for Construct's plans, read live from the
// shared shaoor-ai.com control plane's own control.plans — the table its
// admin actually edits at /admin/plans. Mirrors TuiTrak's
// tuitrakweb.control_plans() (the reference implementation,
// C:\Projects\TuiTrakWeb\supabase\migrations\0039_control_plans_live_read.sql),
// just as a Prisma $queryRaw instead of a security-definer Postgres
// function: this app's Prisma connection already has direct cross-schema
// SQL access to `control` (see lib/control-sync.ts's own comment), so no
// PostgREST-exposed wrapper is needed the way TuiTrak/Pets require one.
//
// construct.plans (the Plan model) keeps only what has no equivalent
// here — seat/project/media limits, the Razorpay plan ids, and the
// isTrial/isFreeForever flags this app's own cron and gating logic read.
export type ConstructControlPlan = {
  code: string;
  name: string;
  /** Rupees, not paise — already converted from control.plans' price_amount. Null = not priced (e.g. TRIAL). */
  priceMonthlyInr: number | null;
  billingInterval: string | null;
  trialDays: number | null;
  isTopTier: boolean;
  isActive: boolean;
  sortOrder: number;
  featureLines: string[];
};

type Row = {
  code: string;
  name: string;
  price_amount: number | null;
  billing_interval: string | null;
  default_trial_days: number | null;
  is_top_tier: boolean;
  is_active: boolean;
  sort_order: number | null;
  feature_lines: string | null;
};

function splitFeatureLines(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// Cached per request: read by the pricing page, the dashboard billing
// section and provisioning's trial-length lookup, often on the same
// render — one query instead of three.
export const getConstructControlPlans = cache(async (): Promise<ConstructControlPlan[]> => {
  const rows = await getConstructPrisma().$queryRaw<Row[]>`
    SELECT cp.code, cp.name, cp.price_amount, cp.billing_interval, cp.default_trial_days,
           cp.is_top_tier, cp.is_active, cp.sort_order, cp.feature_lines
    FROM control.plans cp
    JOIN control.products p ON p.id = cp.product_id
    WHERE p.code = 'SHAOOR_CONSTRUCT'
  `;
  return rows
    .map((row) => ({
      code: row.code,
      name: row.name,
      // control.plans.price_amount is in paise; Construct's own display
      // convention elsewhere (e.g. the settings page before this change)
      // was plain rupees.
      priceMonthlyInr: row.price_amount === null ? null : row.price_amount / 100,
      billingInterval: row.billing_interval,
      trialDays: row.default_trial_days,
      isTopTier: row.is_top_tier,
      isActive: row.is_active,
      sortOrder: row.sort_order ?? 0,
      featureLines: splitFeatureLines(row.feature_lines),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
});

export const getConstructControlPlan = cache(async (code: string): Promise<ConstructControlPlan | null> => {
  const plans = await getConstructControlPlans();
  return plans.find((plan) => plan.code === code) ?? null;
});
