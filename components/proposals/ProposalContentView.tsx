import Image from "next/image";
import { CheckCircle2, Star } from "lucide-react";

import { formatMoney } from "@/lib/proposal-money";
import type { ProposalSnapshot } from "@/lib/services/construct-proposal-snapshot.service";

// Shared between the public /proposals/[token] page and the dashboard's
// own draft preview — exactly one place renders "what the customer-
// visible version looks like", so the two can never silently drift.
// Takes a ProposalSnapshot-shaped object either way: the public page
// passes an actual stored (immutable) revision snapshot, the dashboard
// preview builds an equivalent object on the fly from the current,
// still-editable draft fields (see app/dashboard/proposals/[id]/preview).

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <section className="border-t border-slate-200 py-6 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{children}</div>
    </section>
  );
}

function PricingBlock({ pricing }: { pricing: ProposalSnapshot["pricing"] }) {
  if (pricing.mode === "DISCUSS") {
    return <p className="text-sm leading-7 text-slate-700">Pricing to be discussed directly with the team.</p>;
  }
  const amount = pricing.mode === "FIXED" ? formatMoney(pricing.amountMinor, pricing.currency) : `${formatMoney(pricing.minAmountMinor, pricing.currency)} – ${formatMoney(pricing.maxAmountMinor, pricing.currency)}`;
  return (
    <div>
      <p className="font-mono text-2xl font-bold text-slate-950">{amount}{pricing.mode === "RANGE" && <span className="ml-2 align-middle text-xs font-sans font-semibold uppercase tracking-wide text-slate-500">Indicative range</span>}</p>
      {pricing.basis && <p className="mt-1 text-sm text-slate-600">{pricing.basis}</p>}
      {pricing.taxNote && <p className="mt-1 text-xs text-slate-500">{pricing.taxNote}</p>}
      <p className="mt-2 text-xs text-slate-500">Indicative, subject to the assumptions above and any necessary site assessment. This proposal is not a binding contract.</p>
    </div>
  );
}

export function ProposalContentView({ snapshot, revisionLabel }: { snapshot: ProposalSnapshot; revisionLabel: string }) {
  const s = snapshot;
  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
        {s.branding.logoUrl && <Image src={s.branding.logoUrl} alt={s.branding.companyName} width={48} height={48} unoptimized className="size-12 rounded object-contain" />}
        <div>
          <p className="font-bold text-slate-950">{s.branding.companyName || "Your company"}</p>
          <p className="text-xs text-slate-500">{s.branding.phone}{s.branding.email ? ` · ${s.branding.email}` : ""}</p>
        </div>
      </div>

      <header className="py-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Proposal {s.reference} · {revisionLabel}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{s.title || "Untitled proposal"}</h1>
        {s.expiresAt && <p className="mt-2 text-xs text-amber-700">Valid until {new Date(s.expiresAt).toLocaleDateString()}</p>}
      </header>

      <Section title="Introduction">{s.introduction}</Section>
      <Section title="Your requirements">{s.requirementsSummary}</Section>
      <Section title="Proposed scope of work">{s.scopeOfWork}</Section>
      <Section title="Exclusions">{s.exclusions}</Section>
      <Section title="Assumptions">{s.assumptions}</Section>
      <Section title="Indicative timeline">{s.indicativeTimeline}</Section>

      <section className="border-t border-slate-200 py-6">
        <h2 className="text-lg font-bold text-slate-950">Pricing</h2>
        <div className="mt-2"><PricingBlock pricing={s.pricing} /></div>
      </section>

      {s.portfolio.length > 0 && (
        <section className="border-t border-slate-200 py-6">
          <h2 className="text-lg font-bold text-slate-950">Relevant work</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {s.portfolio.map((project) => (
              <article key={project.projectId} className="overflow-hidden rounded-lg border border-slate-200">
                {project.coverImageUrl && <div className="relative aspect-3/2 bg-slate-100"><Image src={project.coverImageUrl} alt={project.title} fill unoptimized className="object-cover" /></div>}
                <div className="p-4">
                  <p className="font-bold text-slate-950">{project.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{project.category} · {project.location} · {project.year}</p>
                  <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                  {project.highlights.length > 0 && <ul className="mt-2 space-y-1">{project.highlights.slice(0, 4).map((h) => <li key={h} className="flex items-start gap-1.5 text-xs text-slate-600"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-slate-400" />{h}</li>)}</ul>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {s.testimonials.length > 0 && (
        <section className="border-t border-slate-200 py-6">
          <h2 className="text-lg font-bold text-slate-950">What clients say</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {s.testimonials.map((t, i) => (
              <blockquote key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex gap-0.5">{Array.from({ length: t.rating }).map((_, idx) => <Star key={idx} className="size-3.5 fill-amber-400 text-amber-400" />)}</div>
                <p className="mt-2 text-sm italic text-slate-700">&ldquo;{t.testimonial}&rdquo;</p>
                <p className="mt-2 text-xs font-semibold text-slate-600">{t.clientName}{t.company ? ` · ${t.company}` : ""}</p>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <Section title="Next steps">{s.closingMessage}</Section>
    </>
  );
}
