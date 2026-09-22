import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { getConstructControlPlans } from "@/lib/services/construct-plan-catalog.service";

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
        <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <article
              key={plan.code}
              className={`relative flex flex-col rounded-lg border bg-white p-6 shadow-[0_8px_24px_rgba(9,65,54,.06)] ${plan.isTopTier ? "border-[#7D9D76] ring-2 ring-[#7D9D76]" : "border-slate-200"}`}
            >
              {plan.isTopTier && (
                <div className="absolute -top-3 left-6 rounded-full bg-(image:--gradient-secondary-bg) px-3 py-1 text-[11px] font-bold uppercase tracking-[.08em] text-white">
                  Most popular
                </div>
              )}
              <h2 className="text-lg font-bold text-(--color-primary-text)">{plan.name}</h2>
              <p className="mt-1 font-mono text-2xl font-bold">
                {plan.priceMonthlyInr ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(plan.priceMonthlyInr) : "Free"}
                {plan.priceMonthlyInr && <span className="text-xs font-normal text-slate-500">/{plan.billingInterval === "ANNUAL" ? "yr" : "mo"}</span>}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {plan.priceMonthlyInr ? `Billed ${plan.billingInterval === "ANNUAL" ? "annually" : "monthly"}${trialDays ? `, after a ${trialDays}-day trial` : ""}` : "Free forever"}
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm">
                {plan.featureLines.map((line) => (
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
          ))}
        </div>
        {plans.length === 0 && (
          <p className="text-center text-slate-500">Pricing is being finalized — check back shortly, or contact us directly.</p>
        )}
      </section>
    </main>
  );
}
