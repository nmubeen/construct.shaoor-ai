import type { Metadata } from "next";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { PricingPlanGrid, type PricingFamily } from "@/components/pricing/PricingPlanGrid";
import { getConstructControlPlans, type ConstructControlPlan } from "@/lib/services/construct-plan-catalog.service";

const FAMILY_SUFFIX = /_(MONTHLY|ANNUAL)$/;

function familyDisplayName(key: string) {
  return key.split("_").map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
}

// Groups e.g. STARTER_MONTHLY + STARTER_ANNUAL into one PricingFamily, keyed
// by the code with that suffix stripped — see PricingPlanGrid's own comment
// for why grouping lives here rather than in the catalog service itself
// (only the pricing page needs it; the dashboard billing section and
// signup still address individual plan codes directly).
function groupIntoFamilies(plans: ConstructControlPlan[]): PricingFamily[] {
  const families = new Map<string, PricingFamily>();
  for (const plan of plans) {
    const suffixMatch = plan.code.match(FAMILY_SUFFIX);
    const key = suffixMatch ? plan.code.slice(0, -suffixMatch[0].length) : plan.code;
    const family = families.get(key) ?? {
      key,
      displayName: familyDisplayName(key),
      isTopTier: false,
      sortOrder: plan.sortOrder,
      monthly: null,
      annual: null,
      single: null,
    };
    family.isTopTier ||= plan.isTopTier;
    family.sortOrder = Math.min(family.sortOrder, plan.sortOrder);
    if (!suffixMatch) family.single = plan;
    else if (plan.billingInterval === "ANNUAL") family.annual = plan;
    else family.monthly = plan;
    families.set(key, family);
  }
  return Array.from(families.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

// Shaoor-AI Construct's own SaaS pricing — a top-level, non-tenant route
// (like /account, /dashboard), not part of the tenant (website) route
// group: it shows the same content regardless of which host it's reached
// on, same as those. Name/price/feature list all come live from the
// shared shaoor-ai.com control plane's own control.plans, so an edit made
// in its /admin/plans UI shows up here with no deploy — mirrors TuiTrak's
// app/pricing/page.tsx (the reference implementation,
// C:\Projects\TuiTrakWeb), restyled with Construct's own portal branding
// (components/portal/ConstructPortalHome.tsx's tokens) rather than
// TuiTrak's or a tenant site's theme, since this page is never tenant-
// themed. TRIAL itself never renders as a card (control.plans marks it
// is_active: false — it's how every paid plan starts, not something
// purchased on its own).
export const metadata: Metadata = {
  title: "Pricing | Shaoor-AI Construct",
  description: "Simple, transparent pricing for Shaoor-AI Construct — professional construction company websites with a plan-controlled CMS.",
};

export default async function PricingPage() {
  const allPlans = await getConstructControlPlans();
  const plans = allPlans.filter((plan) => plan.isActive);
  const trialDays = allPlans.find((plan) => plan.code === "TRIAL")?.trialDays ?? null;
  const families = groupIntoFamilies(plans);

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-slate-950">
      {/* PrimaryBackgroundColor (--gradient-primary-bg) — matches the portal home's own hero chrome. */}
      <header className="bg-(image:--gradient-primary-bg) text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo />
            <span>
              <span className="block text-lg font-bold leading-tight text-white">Shaoor-AI Construct</span>
              <span className="block text-[10px] font-bold uppercase tracking-[.24em] text-(--color-secondary-text-icon)">by Shaoor AI Tech</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold text-slate-200 hover:text-white">Home</Link>
            <Link href="/account/login" className="rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">Customer sign in</Link>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-10 text-center sm:px-8">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Simple pricing for your construction website</h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Every paid plan starts with{trialDays ? ` a ${trialDays}-day` : ""} free trial — no card required. Downgrade
            automatically if you don&rsquo;t convert; nothing you&rsquo;ve published is ever deleted.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        {families.length > 0 ? (
          <PricingPlanGrid families={families} trialDays={trialDays} />
        ) : (
          <p className="text-center text-slate-500">Pricing is being finalized — check back shortly, or contact us directly.</p>
        )}
      </section>
    </main>
  );
}
