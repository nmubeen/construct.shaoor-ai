import { Activity, Building2, CreditCard, ExternalLink, Globe2, Radio } from "lucide-react";

import { CancelSubscriptionButton } from "@/components/dashboard/billing/CancelSubscriptionButton";
import { RazorpayCheckout } from "@/components/dashboard/billing/RazorpayCheckout";
import { ConfirmActionButton } from "@/components/dashboard/shared/ConfirmActionButton";
import { ProductAccessCard } from "@/components/dashboard/settings/ProductAccessCard";
import { PublishChecklist } from "@/components/dashboard/settings/PublishChecklist";
import { DismissOnEdit } from "@/components/dashboard/shared/DismissOnEdit";
import { ThemeBrandingForm } from "@/components/dashboard/settings/ThemeBrandingForm";
import { addConstructDomainAction, makeConstructDomainPrimaryAction, removeConstructDomainAction, updateConstructPublicationAction, updateConstructWorkspaceAction, verifyConstructDomainAction } from "@/lib/actions/construct-settings.actions";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { getConstructPlanUsage } from "@/lib/control/construct-subscription.service";
import { getConstructControlPlans } from "@/lib/services/construct-plan-catalog.service";
import { getConstructPublishChecklist } from "@/lib/services/construct-publish-checklist.service";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const context = await requireActiveConstructContext(); const query = await searchParams; const canAdmin = context.role === "OWNER" || context.role === "ADMIN"; const isOwner = context.role === "OWNER"; const prisma = getConstructPrisma();
  const [publication, domains, audit, usage, plan, controlPlans, subscription, siteSettings, checklist] = await Promise.all([
    prisma.sitePublication.findUnique({ where: { organizationId: context.organizationId } }),
    prisma.domain.findMany({ where: { organizationId: context.organizationId }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] }),
    prisma.auditLog.findMany({ where: { organizationId: context.organizationId }, orderBy: { createdAt: "desc" }, take: 20 }),
    getConstructPlanUsage(context.organizationId),
    // Local: only the seat/project/media limits and the isFreeForever flag
    // this app's own gating logic reads — no equivalent in control.plans.
    prisma.plan.findUnique({ where: { code: context.organization.planCode } }),
    // Name/price/billing-interval: read live from the shared control plane
    // (see lib/services/construct-plan-catalog.service.ts) so an edit made
    // in the shared /admin/plans UI shows up here with no deploy.
    getConstructControlPlans(),
    prisma.subscription.findUnique({ where: { organizationId: context.organizationId } }),
    prisma.siteSettings.findUnique({ where: { organizationId: context.organizationId }, select: { logoUrl: true, themePrimaryColor: true, themeAccentColor: true } }),
    getConstructPublishChecklist(context.organizationId),
  ]);
  const controlPlan = controlPlans.find(p => p.code === context.organization.planCode);
  const primaryDomain = domains.find(domain => domain.isPrimary);
  const cnameTarget = process.env.CONSTRUCT_CNAME_TARGET ?? "construct.shaoor-ai.com";
  // subscription.status is the authoritative flag (set by the Razorpay
  // webhook), same convention TuiTrak's own billing page uses — not
  // derived from which plan code the org happens to be on: a trial runs
  // directly on the real plan being trialed (see lib/auth/provisioning.ts),
  // so there's no separate "Trial" plan code to check for any more.
  const isTrialing = subscription?.status === "TRIALING" && context.organization.trialEndsAt;
  const isPaying = subscription?.status === "ACTIVE" && subscription.razorpaySubscriptionId;
  const priceLabel = controlPlan?.priceMonthlyInr ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(controlPlan.priceMonthlyInr) : null;
  // Whichever plan the shared admin has flagged as top tier, for the
  // trial/free "Add card" CTA below — falls back to a sensible entry
  // plan if nothing is currently flagged.
  const suggestedUpgradeCode = controlPlans.find(p => p.isTopTier && p.isActive)?.code ?? "STARTER_MONTHLY";
  // Every plan code here is already interval-specific (…_MONTHLY /
  // …_ANNUAL — see construct.plans), so the Razorpay checkout's own
  // interval must be derived from whichever code is actually being
  // charged, not left at RazorpayCheckout's "monthly" default: an org
  // whose planCode is GROWTH_ANNUAL still needs interval="annual" so
  // /api/razorpay/subscription reads razorpayPlanIdAnnual instead of the
  // (correctly empty) razorpayPlanIdMonthly column on that same row.
  const checkoutPlanCode = plan?.isFreeForever ? suggestedUpgradeCode : context.organization.planCode;
  const checkoutInterval = checkoutPlanCode.endsWith("_ANNUAL") ? "annual" : "monthly";
  return <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-(--color-secondary-text-icon)">Workspace administration</p><h1 className="mt-2 text-3xl font-bold text-(--color-primary-text)">Settings</h1><p className="mt-2 text-sm text-slate-600">Manage workspace identity, publishing, domains and access status.</p></header>{query.error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
    <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-lg border border-slate-200 bg-(image:--gradient-form-bg) p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Building2 className="size-5 text-(--color-secondary-text-icon)"/><h2 className="font-bold text-(--color-primary-text)">Workspace identity</h2></div><form action={updateConstructWorkspaceAction} className="space-y-4"><label className="grid gap-1.5 text-sm font-semibold">Workspace name<span className="text-xs font-normal text-slate-500">2–100 characters.</span><input name="name" defaultValue={context.organization.name} disabled={!canAdmin} minLength={2} maxLength={100} className="rounded-md border border-slate-300 px-3 py-2.5 font-normal disabled:bg-slate-100"/></label><label className="grid gap-1.5 text-sm font-semibold">Workspace slug<span className="text-xs font-normal text-slate-500">The slug is permanent because it forms the default site address.</span><input value={context.organization.slug} readOnly className="rounded-md border border-slate-300 bg-slate-100 px-3 py-2.5 font-normal"/></label><div className="flex items-center gap-4">{query.saved === "workspace" && <DismissOnEdit><p className="text-sm font-semibold text-(--color-primary-text)">Saved successfully.</p></DismissOnEdit>}{canAdmin && <button className="rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white">Save workspace</button>}</div></form><div className="mt-6 rounded-lg border border-transparent bg-(image:--gradient-primary-bg) p-6 text-white shadow-[0_12px_30px_rgba(9,65,54,.18)]"><p className="text-xs font-bold uppercase tracking-[0.18em] text-(--color-secondary-text-icon)">Website address</p><p className="mt-3 break-all font-semibold">{primaryDomain?.hostname ?? `${context.organization.slug}.construct.shaoor-ai.com`}</p><p className="mt-2 text-sm text-slate-400">Domain status: {primaryDomain?.status.toLowerCase() ?? "active"} · Website: {publication?.status.toLowerCase() ?? "draft"}</p><a href={`https://${primaryDomain?.hostname ?? `${context.organization.slug}.construct.shaoor-ai.com`}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-md bg-(image:--gradient-form-bg) px-4 py-2.5 text-sm font-semibold text-(--color-primary-text) transition hover:brightness-95"><ExternalLink className="size-4"/>Open website preview</a></div></section>
      <section className="rounded-lg border border-slate-200 bg-(image:--gradient-form-bg) p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Radio className="size-5 text-(--color-secondary-text-icon)"/><h2 className="font-bold text-(--color-primary-text)">Publication</h2></div><p className="text-sm text-slate-600">Current state: <strong>{publication?.status ?? "DRAFT"}</strong></p>{publication?.publishedAt && <p className="mt-1 text-xs text-slate-500">Last published {publication.publishedAt.toLocaleString()}</p>}{canAdmin && <form action={updateConstructPublicationAction} className="mt-4 flex flex-wrap items-center gap-2"><button name="status" value="PUBLISHED" className="rounded-lg bg-(image:--gradient-button-bg) px-3 py-2 text-sm font-semibold text-white">Publish</button><button name="status" value="UNPUBLISHED" className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-700">Unpublish</button><button name="status" value="DRAFT" className="rounded-lg border px-3 py-2 text-sm font-semibold">Return to draft</button>{query.saved === "publication" && <DismissOnEdit><p className="text-sm font-semibold text-(--color-primary-text)">Saved successfully.</p></DismissOnEdit>}</form>}<PublishChecklist items={checklist} isPublished={publication?.status === "PUBLISHED"} /></section>
      <ProductAccessCard usage={usage} workspaceStatus={context.organization.status} role={context.role}/>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><CreditCard className="size-5 text-(--color-secondary-text-icon)"/><h2 className="font-bold text-(--color-primary-text)">Billing</h2></div>
        <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-sm font-semibold">{controlPlan?.name ?? plan?.name ?? context.organization.planCode}{isTrialing && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">trial</span>}{subscription?.status === "PAST_DUE" && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">past due</span>}</div><p className="mt-1 text-xs text-slate-500">{isTrialing ? `Ends ${context.organization.trialEndsAt!.toLocaleDateString()}${priceLabel ? ` · then ${priceLabel}/mo` : ""} · no card required` : priceLabel ? `${priceLabel}/mo` : "Contact sales for pricing"}</p></div>
          {/* A trialing org is already on the real plan it's trialing (e.g.
              GROWTH_MONTHLY) — "Add card" charges for that same plan, not
              a possibly-different suggested one. Only a Free-tier org
              (never trialed, or a lapsed trial that was downgraded) needs
              a plan suggested to it. */}
          {isOwner && (isPaying ? <CancelSubscriptionButton organizationId={context.organizationId} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"/> : <RazorpayCheckout organizationId={context.organizationId} planCode={checkoutPlanCode} interval={checkoutInterval} workspaceName={context.organization.name} userEmail={context.authUser.email} className="rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Add card</RazorpayCheckout>)}</div>
        {!isOwner && <p className="mt-3 text-xs text-slate-500">Only the workspace owner can manage billing.</p>}
        <a href="/pricing" target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-(--color-secondary-text-icon) hover:underline">See all plans →</a>
        <p className="mt-4 text-xs leading-5 text-slate-500">Payments are processed by Razorpay — Shaoor-AI Construct never stores your card or UPI details directly. Cancelling keeps this plan through the period you&apos;ve already paid for; after that the workspace moves to the free tier automatically, same as a trial that lapses without a card.</p>
      </section>
      <section className="rounded-lg border border-slate-200 bg-(image:--gradient-form-bg) p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Globe2 className="size-5 text-(--color-secondary-text-icon)"/><h2 className="font-bold text-(--color-primary-text)">Add custom domain</h2></div><p className="mb-4 text-xs leading-5 text-slate-500">Add the hostname, then create a CNAME pointing to <strong>{cnameTarget}</strong>. A unique TXT verification record will appear below.</p>{canAdmin && <form action={addConstructDomainAction} className="flex items-center gap-2"><input required name="hostname" placeholder="www.customer.com" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2.5 text-sm"/><button className="rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white">Add</button>{query.saved === "domain" && <DismissOnEdit><p className="shrink-0 text-sm font-semibold text-(--color-primary-text)">Added successfully.</p></DismissOnEdit>}</form>}</section>
      {canAdmin && <ThemeBrandingForm currentPrimary={siteSettings?.themePrimaryColor ?? null} currentAccent={siteSettings?.themeAccentColor ?? null} logoUrl={siteSettings?.logoUrl ?? null} />}
    </div>
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b p-5"><h2 className="font-bold">Domains</h2></div><div className="divide-y">{domains.map(domain => <div key={domain.id} className="p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{domain.hostname}</p>{domain.isPrimary && <span className="rounded-full bg-[#eef3ec] px-2 py-0.5 text-xs font-bold text-(--color-secondary-text-icon)">Primary</span>}<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{domain.status}</span></div>{!domain.hostname.endsWith(".construct.shaoor-ai.com") && domain.status !== "ACTIVE" && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><p><strong>TXT host:</strong> _shaoor-verify.{domain.hostname}</p><p className="mt-1 break-all"><strong>TXT value:</strong> {domain.verificationToken}</p><p className="mt-1"><strong>CNAME:</strong> {domain.hostname} → {cnameTarget}</p></div>}</div>{canAdmin && <div className="flex flex-wrap gap-2">{!domain.hostname.endsWith(".construct.shaoor-ai.com") && domain.status !== "ACTIVE" && <form action={verifyConstructDomainAction}><input type="hidden" name="id" value={domain.id}/><button className="rounded-lg border px-3 py-1.5 text-xs font-semibold">Verify DNS</button></form>}{domain.status === "ACTIVE" && !domain.isPrimary && <form action={makeConstructDomainPrimaryAction}><input type="hidden" name="id" value={domain.id}/><button className="rounded-lg border px-3 py-1.5 text-xs font-semibold">Make primary</button></form>}{!domain.isPrimary && domain.hostname !== `${context.organization.slug}.construct.shaoor-ai.com` && <form action={removeConstructDomainAction}><input type="hidden" name="id" value={domain.id}/><ConfirmActionButton message={`Remove ${domain.hostname} from this workspace?`} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700">Remove</ConfirmActionButton></form>}</div>}</div></div>)}</div></section>
    <section className="mt-5 rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b p-5"><Activity className="size-5 text-(--color-secondary-text-icon)"/><h2 className="font-bold text-(--color-primary-text)">Recent activity</h2></div>{audit.length === 0 ? <p className="p-5 text-sm text-slate-500">No activity recorded.</p> : <div className="divide-y">{audit.map(item => <div key={item.id} className="flex items-start justify-between gap-4 p-4"><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs uppercase text-slate-400">{item.module} · {item.action}</p></div><time className="shrink-0 text-xs text-slate-400">{item.createdAt.toLocaleString()}</time></div>)}</div>}</section>
  </div>;
}
