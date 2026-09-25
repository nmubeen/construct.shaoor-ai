import type { Metadata } from "next";
import { Printer } from "lucide-react";

import { ProposalContentView } from "@/components/proposals/ProposalContentView";
import { ProposalResponseForm } from "@/components/proposals/ProposalResponseForm";
import { recordConstructProposalView, resolveConstructProposalByToken } from "@/lib/services/construct-proposal-public.service";

// A plain top-level route (like /pricing), deliberately outside the
// (website) route group: no tenant-domain resolution, no SitePublication
// gating — this works the same regardless of which host the request
// arrived on, and independently of whether the organization's marketing
// website is published or not. Access is controlled entirely by the
// bearer token (see resolveConstructProposalByToken) plus organization
// status, not by anything host-based.
//
// Never index/follow, never cached with customer data in view — every
// render re-checks token validity, publication status, expiry and
// organization suspension live.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  // Deliberately generic — never the customer's name, email or phone,
  // even for a valid token (see the product spec's requirement not to
  // leak contact details via page titles/social metadata/link previews).
  return {
    title: "Proposal",
    robots: { index: false, follow: false, nocache: true },
    // No openGraph/twitter block at all — a link preview then falls back
    // to the bare title above instead of guessing at page content.
  };
}

function UnavailablePage({ reason }: { reason: "not-found" | "revoked" | "expired" | "unavailable" }) {
  const copy: Record<typeof reason, { title: string; body: string }> = {
    "not-found": { title: "Proposal not found", body: "This link doesn't match a proposal we can show you. Please check the link, or contact the company directly." },
    "revoked": { title: "This proposal is no longer available", body: "The company has withdrawn this link. Please contact them directly for an up-to-date proposal." },
    "expired": { title: "This proposal has expired", body: "This link is past its validity date. Please contact the company for an updated proposal." },
    "unavailable": { title: "This proposal is temporarily unavailable", body: "Please contact the company directly." },
  };
  const { title, body } = copy[reason];
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{body}</p>
      </div>
    </main>
  );
}

export default async function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resolved = await resolveConstructProposalByToken(token);
  if (!resolved.ok) return <UnavailablePage reason={resolved.reason} />;

  // Real customer traffic only — the dashboard preview never renders
  // this route, so every call here is a genuine open.
  await recordConstructProposalView(resolved.proposal.proposalId);

  const s = resolved.proposal.snapshot;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10 print:max-w-none print:border-none print:p-0 print:shadow-none">
        <ProposalContentView snapshot={s} revisionLabel={`Revision dated ${new Date(s.publishedAt).toLocaleDateString()}`} />

        <section className="border-t border-slate-200 pt-6">
          <ProposalResponseForm token={token} />
        </section>

        <p className="mt-8 border-t border-slate-100 pt-4 text-center text-xs text-slate-400 print:hidden">
          <Printer className="mr-1 inline size-3.5" /> Use your browser&apos;s Print (Ctrl/Cmd+P) to save this proposal as a PDF.
        </p>
      </div>
    </main>
  );
}
