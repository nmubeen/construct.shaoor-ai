import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";
import type { ProposalSnapshot } from "@/lib/services/construct-proposal-snapshot.service";

export type ResolvedConstructProposal = {
  proposalId: string;
  organizationId: string;
  revisionNumber: number;
  snapshot: ProposalSnapshot;
};

export type ResolveProposalResult =
  | { ok: true; proposal: ResolvedConstructProposal }
  // Every failure mode renders the same honest-but-generic public page —
  // never the customer's own name/email/phone, regardless of why the
  // link didn't resolve (see the product spec's "handle invalid, expired
  // and revoked links without revealing customer information").
  | { ok: false; reason: "not-found" | "revoked" | "expired" | "unavailable" };

// The ONLY way the public route resolves a proposal — by the exact
// token, plus publication/expiry/organization-status checks. Never a
// sequential id, never trusts anything else in the URL. Organization
// suspension (status !== "ACTIVE") makes the link unavailable even
// though the Proposal row itself is still PUBLISHED and unexpired —
// administrative suspension overrides everything else, consistently
// with how the rest of the app gates access on organization.status.
export async function resolveConstructProposalByToken(token: string): Promise<ResolveProposalResult> {
  if (!token || token.length < 20) return { ok: false, reason: "not-found" };
  const prisma = getConstructPrisma();

  const proposal = await prisma.proposal.findUnique({
    where: { token },
    include: {
      organization: { select: { status: true } },
      revisions: { orderBy: { revisionNumber: "desc" }, take: 1 },
    },
  });
  if (!proposal) return { ok: false, reason: "not-found" };
  if (proposal.organization.status !== "ACTIVE") return { ok: false, reason: "unavailable" };
  if (proposal.status === "REVOKED") return { ok: false, reason: "revoked" };
  if (proposal.status === "DRAFT") return { ok: false, reason: "not-found" }; // never externally accessible
  if (proposal.expiresAt && proposal.expiresAt < new Date()) return { ok: false, reason: "expired" };

  const latest = proposal.revisions[0];
  if (!latest) return { ok: false, reason: "not-found" }; // published flag flipped before a revision exists — shouldn't happen, fail closed

  return {
    ok: true,
    proposal: {
      proposalId: proposal.id,
      organizationId: proposal.organizationId,
      revisionNumber: latest.revisionNumber,
      snapshot: latest.snapshot as unknown as ProposalSnapshot,
    },
  };
}

// Aggregate-only view tracking (firstOpenedAt/lastOpenedAt/openCount on
// Proposal) rather than a per-event log — simpler, and it's all the
// product spec actually asks for. Dedupes refreshes/rapid re-visits by
// only advancing openCount when the last recorded open is more than 30
// minutes old; lastOpenedAt itself always advances so "most recently
// opened" stays accurate. The dashboard preview never calls this at all
// (it renders the snapshot directly from the authenticated dashboard
// route), so nothing here needs to distinguish owner vs customer traffic
// after the fact.
const VIEW_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

export async function recordConstructProposalView(proposalId: string): Promise<void> {
  const prisma = getConstructPrisma();
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, select: { firstOpenedAt: true, lastOpenedAt: true } });
  if (!proposal) return;
  const now = new Date();
  const isNewSession = !proposal.lastOpenedAt || now.getTime() - proposal.lastOpenedAt.getTime() > VIEW_DEDUPE_WINDOW_MS;
  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      firstOpenedAt: proposal.firstOpenedAt ?? now,
      lastOpenedAt: now,
      ...(isNewSession ? { openCount: { increment: 1 } } : {}),
    },
  });
}
