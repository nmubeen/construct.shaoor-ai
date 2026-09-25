import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/construct-client";

import { recordConstructProposalView, resolveConstructProposalByToken } from "@/lib/services/construct-proposal-public.service";
import { buildConstructProposalSnapshot } from "@/lib/services/construct-proposal-snapshot.service";
import { createTestEnquiry, createTestOrganization, createTestProposal, testPrisma } from "./fixtures";

describe("resolveConstructProposalByToken (public bearer-link access)", () => {
  let prisma: PrismaClient;
  let organizationId: string;
  let enquiryId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Proposal Public Access Test");
    organizationId = org.id;
    const enquiry = await createTestEnquiry(prisma, organizationId);
    enquiryId = enquiry.id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } }); // cascades everything under it
    await prisma.$disconnect();
  });

  it("never resolves a DRAFT proposal — editing a draft can never make it externally accessible", async () => {
    const draft = await createTestProposal(prisma, organizationId, enquiryId, { status: "DRAFT" });
    const result = await resolveConstructProposalByToken(draft.token);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not-found");
  });

  it("rejects an unknown token without revealing anything", async () => {
    const result = await resolveConstructProposalByToken("this-token-does-not-exist-1234567890");
    expect(result).toEqual({ ok: false, reason: "not-found" });
  });

  it("resolves a PUBLISHED, unexpired proposal and serves its latest revision snapshot", async () => {
    const proposal = await createTestProposal(prisma, organizationId, enquiryId, { status: "PUBLISHED" });
    const snapshot = await buildConstructProposalSnapshot(proposal.id, 1);
    await prisma.proposalRevision.create({ data: { organizationId, proposalId: proposal.id, revisionNumber: 1, snapshot: snapshot as unknown as object } });

    const result = await resolveConstructProposalByToken(proposal.token);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.proposal.proposalId).toBe(proposal.id);
      expect(result.proposal.revisionNumber).toBe(1);
      expect(result.proposal.snapshot.reference).toBe(proposal.reference);
    }
  });

  it("refuses a REVOKED proposal", async () => {
    const proposal = await createTestProposal(prisma, organizationId, enquiryId, { status: "REVOKED" });
    const result = await resolveConstructProposalByToken(proposal.token);
    expect(result).toEqual({ ok: false, reason: "revoked" });
  });

  it("refuses an expired proposal even though it's still PUBLISHED", async () => {
    const proposal = await createTestProposal(prisma, organizationId, enquiryId, { status: "PUBLISHED", expiresAt: new Date(Date.now() - 60_000) });
    const result = await resolveConstructProposalByToken(proposal.token);
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("refuses access once the organization is suspended, even for a valid published link", async () => {
    const proposal = await createTestProposal(prisma, organizationId, enquiryId, { status: "PUBLISHED" });
    const snapshot = await buildConstructProposalSnapshot(proposal.id, 1);
    await prisma.proposalRevision.create({ data: { organizationId, proposalId: proposal.id, revisionNumber: 1, snapshot: snapshot as unknown as object } });

    await prisma.organization.update({ where: { id: organizationId }, data: { status: "SUSPENDED" } });
    try {
      const result = await resolveConstructProposalByToken(proposal.token);
      expect(result).toEqual({ ok: false, reason: "unavailable" });
    } finally {
      await prisma.organization.update({ where: { id: organizationId }, data: { status: "ACTIVE" } }); // restore for the remaining tests/afterAll
    }
  });

  it("records views with dedupe (rapid repeat opens don't inflate the count) and advances lastOpenedAt", async () => {
    const proposal = await createTestProposal(prisma, organizationId, enquiryId, { status: "PUBLISHED" });
    await recordConstructProposalView(proposal.id);
    await recordConstructProposalView(proposal.id); // immediate repeat — within the dedupe window

    const updated = await prisma.proposal.findUniqueOrThrow({ where: { id: proposal.id } });
    expect(updated.openCount).toBe(1);
    expect(updated.firstOpenedAt).not.toBeNull();
    expect(updated.lastOpenedAt).not.toBeNull();
  });
});
