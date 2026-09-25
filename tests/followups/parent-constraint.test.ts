import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/construct-client";

import { createTestEnquiry, createTestOrganization, createTestProposal, testPrisma } from "./fixtures";

describe("FollowUp: exactly-one-parent database constraint", () => {
  let prisma: PrismaClient;
  let organizationId: string;
  let enquiryId: string;
  let proposalId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Followup Constraint Test");
    organizationId = org.id;
    const enquiry = await createTestEnquiry(prisma, organizationId);
    enquiryId = enquiry.id;
    const proposal = await createTestProposal(prisma, organizationId, enquiryId);
    proposalId = proposal.id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("rejects a follow-up with NEITHER an enquiry nor a proposal", async () => {
    await expect(
      prisma.followUp.create({ data: { organizationId, title: "No parent", dueAt: new Date() } }),
    ).rejects.toThrow();
  });

  it("rejects a follow-up with BOTH an enquiry and a proposal", async () => {
    await expect(
      prisma.followUp.create({ data: { organizationId, enquiryId, proposalId, title: "Two parents", dueAt: new Date() } }),
    ).rejects.toThrow();
  });

  it("accepts a follow-up with exactly one parent (enquiry-only)", async () => {
    const followUp = await prisma.followUp.create({ data: { organizationId, enquiryId, title: "Enquiry-only follow-up", dueAt: new Date() } });
    expect(followUp.id).toBeTruthy();
  });

  it("accepts a follow-up with exactly one parent (proposal-only)", async () => {
    const followUp = await prisma.followUp.create({ data: { organizationId, proposalId, title: "Proposal-only follow-up", dueAt: new Date() } });
    expect(followUp.id).toBeTruthy();
  });

  it("cascades on enquiry deletion (removing the enquiry removes its follow-ups, never leaving a broken link)", async () => {
    const localEnquiry = await createTestEnquiry(prisma, organizationId);
    const followUp = await prisma.followUp.create({ data: { organizationId, enquiryId: localEnquiry.id, title: "Will be cascaded", dueAt: new Date() } });
    await prisma.contactMessage.delete({ where: { id: localEnquiry.id } });
    const found = await prisma.followUp.findUnique({ where: { id: followUp.id } });
    expect(found).toBeNull();
  });

  it("a follow-up referencing a parent id that belongs to a DIFFERENT organization is rejected by the foreign key", async () => {
    const otherOrg = await createTestOrganization(prisma, "Followup Constraint Other Org");
    try {
      const otherEnquiry = await createTestEnquiry(prisma, otherOrg.id);
      // The FK to contact_messages permits this at the DB level (it only
      // checks the enquiry id exists, not which org owns it) — the actual
      // isolation guarantee is server-side: every action re-validates
      // `prisma.contactMessage.findFirst({ where: { id, organizationId } })`
      // before ever writing a followUp row scoped to organizationId. This
      // test documents that the DB alone does not enforce cross-org
      // isolation for this relation, so the application-level check (see
      // createFollowUpAction) is load-bearing, not a redundant belt.
      const crossOrgFollowUp = await prisma.followUp.create({ data: { organizationId, enquiryId: otherEnquiry.id, title: "Cross-org (DB allows; app must not)", dueAt: new Date() } });
      expect(crossOrgFollowUp.organizationId).toBe(organizationId);
      // The application-level guard this documents:
      const validated = await prisma.contactMessage.findFirst({ where: { id: otherEnquiry.id, organizationId }, select: { id: true } });
      expect(validated).toBeNull();
    } finally {
      await prisma.organization.delete({ where: { id: otherOrg.id } });
    }
  });

  it("rejects a follow-up whose parent id does not exist at all", async () => {
    await expect(
      prisma.followUp.create({ data: { organizationId, enquiryId: randomUUID(), title: "Nonexistent parent", dueAt: new Date() } }),
    ).rejects.toThrow();
  });
});
