import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, MessageSquare } from "lucide-react";

import { ProposalEditorForm } from "@/components/proposals/ProposalEditorForm";
import { ProposalItemList } from "@/components/proposals/ProposalItemList";
import { ProposalShareActions } from "@/components/proposals/ProposalShareActions";
import { ConfirmActionButton } from "@/components/dashboard/shared/ConfirmActionButton";
import {
  addConstructProposalPortfolioAction,
  addConstructProposalTestimonialAction,
  approveAndPublishConstructProposalAction,
  removeConstructProposalPortfolioAction,
  removeConstructProposalTestimonialAction,
  reorderConstructProposalPortfolioAction,
  reorderConstructProposalTestimonialAction,
  revokeConstructProposalAction,
} from "@/lib/actions/construct-proposal.actions";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { getConstructEntitlements } from "@/lib/control/construct-subscription.service";
import { appUrl } from "@/lib/construct-app-url";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-[#eef3ec] text-(--color-secondary-text-icon)",
  REVOKED: "bg-red-50 text-red-700",
};

export default async function ProposalEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ published?: string; revoked?: string; error?: string }> }) {
  const context = await requireActiveConstructContext();
  const { id } = await params;
  const query = await searchParams;
  const canApprove = context.role === "OWNER" || context.role === "ADMIN";
  const canEdit = context.role !== "VIEWER";
  const prisma = getConstructPrisma();

  const [proposal, entitlements] = await Promise.all([
    prisma.proposal.findFirst({
      where: { id, organizationId: context.organizationId },
      include: {
        enquiry: { select: { name: true, email: true, phone: true, preferredContactMethod: true } },
        portfolioItems: { orderBy: { sortOrder: "asc" }, include: { project: { select: { title: true, category: true } } } },
        testimonialItems: { orderBy: { sortOrder: "asc" }, include: { testimonial: { select: { clientName: true, rating: true } } } },
        responses: { orderBy: { createdAt: "desc" } },
      },
    }),
    getConstructEntitlements(context.organizationId),
  ]);
  if (!proposal) notFound();

  const isEntitled = Boolean(entitlements?.entitlements.find((e) => e.featureCode === "PROJECT_PROPOSALS")?.booleanValue);
  const readOnly = !canEdit || !isEntitled;

  const [candidateProjects, candidateTestimonials] = await Promise.all([
    prisma.project.findMany({ where: { organizationId: context.organizationId, isActive: true, isSample: false, id: { notIn: proposal.portfolioItems.map((i) => i.projectId) } }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true } }),
    prisma.testimonial.findMany({ where: { organizationId: context.organizationId, isActive: true, id: { notIn: proposal.testimonialItems.map((i) => i.testimonialId) } }, orderBy: { updatedAt: "desc" }, select: { id: true, clientName: true } }),
  ]);

  const publicUrl = `${appUrl()}/proposals/${proposal.token}`;

  // Named function declarations with their own "use server" directive —
  // matches this Next version's own documented inline-Server-Function
  // pattern exactly (node_modules/next/dist/docs/01-app/03-api-reference
  // /01-directives/use-server.md uses `async function x() { 'use server' }`,
  // not an arrow-function const; the arrow form didn't get picked up as a
  // Server Function reference and hit "functions cannot be passed
  // directly to Client Components").
  async function reorderPortfolio(orderedIds: string[]) {
    "use server";
    return reorderConstructProposalPortfolioAction(id, orderedIds);
  }
  async function reorderTestimonials(orderedIds: string[]) {
    "use server";
    return reorderConstructProposalTestimonialAction(id, orderedIds);
  }
  async function removePortfolioItem(itemId: string) {
    "use server";
    await removeConstructProposalPortfolioAction(id, itemId);
  }
  async function removeTestimonialItem(itemId: string) {
    "use server";
    await removeConstructProposalTestimonialAction(id, itemId);
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Link href="/dashboard/proposals" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-(--color-secondary-text-icon)"><ArrowLeft className="size-4" />Back to proposals</Link>

      {query.published && <p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm font-semibold text-(--color-primary-text)">Proposal published.</p>}
      {query.revoked && <p className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Proposal revoked — the public link no longer works.</p>}
      {query.error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
      {!isEntitled && <p className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Personalised proposals are not included in the current plan. Existing records stay visible, but editing and publishing are disabled until the plan is upgraded.</p>}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${STATUS_STYLE[proposal.status]}`}>{proposal.status}</span><span className="text-xs text-slate-500">for {proposal.enquiry.name}</span></div>
          <h1 className="mt-2 text-2xl font-bold text-(--color-primary-text)">{proposal.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/dashboard/proposals/${id}/preview`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Preview</Link>
          <Link href={`/dashboard/messages/${proposal.enquiryId}`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View enquiry</Link>
          {canApprove && isEntitled && (
            <form action={approveAndPublishConstructProposalAction}><input type="hidden" name="id" value={id} /><button className="rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white">{proposal.status === "PUBLISHED" ? "Approve & republish" : "Approve & publish"}</button></form>
          )}
          {canApprove && proposal.status === "PUBLISHED" && (
            <form action={revokeConstructProposalAction}><input type="hidden" name="id" value={id} /><ConfirmActionButton message="Revoke this proposal? The public link will stop working immediately." className="rounded-md border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Revoke</ConfirmActionButton></form>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-(--color-primary-text)">Content</h2>
            <ProposalEditorForm
              proposal={{
                id: proposal.id,
                reference: proposal.reference,
                title: proposal.title,
                introduction: proposal.introduction,
                requirementsSummary: proposal.requirementsSummary,
                scopeOfWork: proposal.scopeOfWork,
                exclusions: proposal.exclusions,
                assumptions: proposal.assumptions,
                closingMessage: proposal.closingMessage,
                indicativeTimeline: proposal.indicativeTimeline,
                expiresAt: proposal.expiresAt,
                internalNotes: proposal.internalNotes,
                priceMode: proposal.priceMode,
                priceCurrency: proposal.priceCurrency,
                priceAmountMinor: proposal.priceAmountMinor,
                priceMinAmountMinor: proposal.priceMinAmountMinor,
                priceMaxAmountMinor: proposal.priceMaxAmountMinor,
                pricingBasis: proposal.pricingBasis,
                taxNote: proposal.taxNote,
              }}
              readOnly={readOnly}
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 font-bold text-(--color-primary-text)">Portfolio</h2>
            <p className="mb-4 text-xs text-slate-500">Suggested from the enquiry&apos;s service and answers when the draft was created. Add, remove or reorder as needed.</p>
            <ProposalItemList
              items={proposal.portfolioItems.map((item) => ({
                id: item.id,
                content: <div><p className="text-sm font-semibold text-slate-800">{item.project.title}</p><p className="text-xs text-slate-500">{item.project.category}{item.reason ? ` · ${item.reason}` : ""}</p></div>,
              }))}
              reorderAction={reorderPortfolio}
              removeAction={removePortfolioItem}
              removeLabel="Remove"
            />
            {proposal.portfolioItems.length === 0 && <p className="text-sm text-slate-500">No strong match was found automatically — add a project manually below.</p>}
            {canEdit && candidateProjects.length > 0 && (
              <form action={addConstructProposalPortfolioAction} className="mt-4 flex gap-2"><input type="hidden" name="proposalId" value={id} /><select name="projectId" required className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">Add a project…</option>{candidateProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select><button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Add</button></form>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 font-bold text-(--color-primary-text)">Testimonials</h2>
            <p className="mb-4 text-xs text-slate-500">Optional — select from your approved testimonials.</p>
            <ProposalItemList
              items={proposal.testimonialItems.map((item) => ({
                id: item.id,
                content: <p className="text-sm font-semibold text-slate-800">{item.testimonial.clientName} <span className="text-xs font-normal text-slate-500">{"★".repeat(item.testimonial.rating)}</span></p>,
              }))}
              reorderAction={reorderTestimonials}
              removeAction={removeTestimonialItem}
              removeLabel="Remove"
            />
            {canEdit && candidateTestimonials.length > 0 && (
              <form action={addConstructProposalTestimonialAction} className="mt-4 flex gap-2"><input type="hidden" name="proposalId" value={id} /><select name="testimonialId" required className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">Add a testimonial…</option>{candidateTestimonials.map((t) => <option key={t.id} value={t.id}>{t.clientName}</option>)}</select><button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Add</button></form>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          {proposal.status === "PUBLISHED" && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-(--color-primary-text)">Share</h2>
              <ProposalShareActions url={publicUrl} customerName={proposal.enquiry.name} whatsAppNumber={proposal.enquiry.phone} />
              <p className="mt-3 text-xs text-slate-500">Preferred contact: {proposal.enquiry.preferredContactMethod || "Not specified"}</p>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-(--color-primary-text)">Activity</h2>
            <div className="flex items-center gap-2 text-sm text-slate-700"><Eye className="size-4 text-slate-400" />{proposal.openCount > 0 ? `Opened ${proposal.openCount} time${proposal.openCount === 1 ? "" : "s"}` : "Not yet opened"}</div>
            {proposal.firstOpenedAt && <p className="mt-1 text-xs text-slate-500">First opened {proposal.firstOpenedAt.toLocaleString()}</p>}
            {proposal.lastOpenedAt && <p className="text-xs text-slate-500">Last opened {proposal.lastOpenedAt.toLocaleString()}</p>}
            <p className="mt-1 text-xs text-slate-400">An open means the link was accessed — not confirmation a particular person read it.</p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-(--color-primary-text)"><MessageSquare className="size-4" />Customer responses</h2>
            {proposal.responses.length === 0 ? <p className="text-sm text-slate-500">No responses yet.</p> : (
              <ul className="space-y-3">
                {proposal.responses.map((r) => (
                  <li key={r.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold uppercase text-(--color-secondary-text-icon)">{r.type === "SITE_VISIT" ? "Site visit requested" : "Wants to discuss"}</span><time className="text-xs text-slate-400">{r.createdAt.toLocaleString()}</time></div>
                    {r.message && <p className="mt-1 text-sm text-slate-700">&ldquo;{r.message}&rdquo;</p>}
                    {(r.preferredDate || r.preferredTime) && <p className="mt-1 text-xs text-slate-500">Preferred: {r.preferredDate ? r.preferredDate.toLocaleDateString() : ""} {r.preferredTime ?? ""}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
