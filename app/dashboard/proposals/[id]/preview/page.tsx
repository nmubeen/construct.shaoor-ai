import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProposalContentView } from "@/components/proposals/ProposalContentView";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { buildConstructProposalSnapshot } from "@/lib/services/construct-proposal-snapshot.service";

// Dashboard-only preview of the CURRENT working copy — never the public
// /proposals/[token] route, and never recorded as a customer "open" (see
// construct-proposal-public.service.ts's comment on why owner previews
// need no special-casing there: this route is the reason). Reuses
// buildConstructProposalSnapshot, the same function publish uses to
// freeze a revision, just without persisting the result — so "preview"
// and "what actually gets published" can never drift apart.
export default async function ProposalPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireActiveConstructContext();
  const { id } = await params;
  const proposal = await getConstructPrisma().proposal.findFirst({ where: { id, organizationId: context.organizationId }, select: { id: true, currentRevisionNumber: true } });
  if (!proposal) notFound();

  const snapshot = await buildConstructProposalSnapshot(id, proposal.currentRevisionNumber + 1);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href={`/dashboard/proposals/${id}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-(--color-secondary-text-icon)"><ArrowLeft className="size-4" />Back to editor</Link>
        <p className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Preview only — this reflects your current draft, not necessarily what customers currently see. Approve &amp; publish to make edits live.</p>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <ProposalContentView snapshot={snapshot} revisionLabel="Draft preview" />
        </div>
      </div>
    </div>
  );
}
