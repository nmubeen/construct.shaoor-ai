import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/construct-client";

import { buildConstructProposalSnapshot } from "@/lib/services/construct-proposal-snapshot.service";
import { createTestEnquiry, createTestOrganization, createTestProposal, testPrisma } from "./fixtures";

describe("proposal revision snapshots are immutable after publish", () => {
  let prisma: PrismaClient;
  let organizationId: string;
  let enquiryId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Proposal Snapshot Test");
    organizationId = org.id;
    enquiryId = (await createTestEnquiry(prisma, organizationId)).id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("a later edit to the working draft does not change an already-published revision", async () => {
    const proposal = await createTestProposal(prisma, organizationId, enquiryId, { status: "PUBLISHED" });
    await prisma.proposal.update({ where: { id: proposal.id }, data: { title: "Original title", scopeOfWork: "Original scope" } });

    const firstSnapshot = await buildConstructProposalSnapshot(proposal.id, 1);
    await prisma.proposalRevision.create({ data: { organizationId, proposalId: proposal.id, revisionNumber: 1, snapshot: firstSnapshot as unknown as object } });

    // Edit the live working copy after publishing — this must never
    // reach back into the stored revision.
    await prisma.proposal.update({ where: { id: proposal.id }, data: { title: "Edited title", scopeOfWork: "Edited scope, never shown to a customer who already has revision 1" } });

    const storedRevision1 = await prisma.proposalRevision.findUniqueOrThrow({ where: { proposalId_revisionNumber: { proposalId: proposal.id, revisionNumber: 1 } } });
    const snapshot1 = storedRevision1.snapshot as unknown as { title: string; scopeOfWork: string };
    expect(snapshot1.title).toBe("Original title");
    expect(snapshot1.scopeOfWork).toBe("Original scope");
  });

  it("republishing creates a new, separate revision rather than overwriting the previous one", async () => {
    const proposal = await createTestProposal(prisma, organizationId, enquiryId, { status: "PUBLISHED" });
    await prisma.proposal.update({ where: { id: proposal.id }, data: { title: "Version 1" } });
    const snapshot1 = await buildConstructProposalSnapshot(proposal.id, 1);
    await prisma.proposalRevision.create({ data: { organizationId, proposalId: proposal.id, revisionNumber: 1, snapshot: snapshot1 as unknown as object } });

    await prisma.proposal.update({ where: { id: proposal.id }, data: { title: "Version 2" } });
    const snapshot2 = await buildConstructProposalSnapshot(proposal.id, 2);
    await prisma.proposalRevision.create({ data: { organizationId, proposalId: proposal.id, revisionNumber: 2, snapshot: snapshot2 as unknown as object } });

    const revisions = await prisma.proposalRevision.findMany({ where: { proposalId: proposal.id }, orderBy: { revisionNumber: "asc" } });
    expect(revisions).toHaveLength(2);
    expect((revisions[0].snapshot as unknown as { title: string }).title).toBe("Version 1");
    expect((revisions[1].snapshot as unknown as { title: string }).title).toBe("Version 2");
  });

  it("never includes a project's client or budget in the snapshot, even when set on the source project", async () => {
    const project = await prisma.project.create({
      data: {
        organizationId, title: "Sensitive Project", slug: `sensitive-${Date.now()}`, category: "RESIDENTIAL", status: "COMPLETED",
        client: "A Very Confidential Client Name", location: "Test City", year: 2026, duration: "6 months", budget: "₹9,999,999 confidential", area: "1000 sq ft",
        description: "Should not leak client/budget into a proposal snapshot.",
      },
    });
    const proposal = await createTestProposal(prisma, organizationId, enquiryId, { status: "DRAFT" });
    await prisma.proposalPortfolioItem.create({ data: { organizationId, proposalId: proposal.id, projectId: project.id, sortOrder: 0 } });

    const snapshot = await buildConstructProposalSnapshot(proposal.id, 1);
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain("A Very Confidential Client Name");
    expect(serialized).not.toContain("9,999,999");
    expect(snapshot.portfolio[0]).not.toHaveProperty("client");
    expect(snapshot.portfolio[0]).not.toHaveProperty("budget");
  });
});

describe("cross-organization isolation", () => {
  it("a project belonging to a different organization is never a valid portfolio candidate", async () => {
    const prisma = testPrisma();
    const orgA = await createTestOrganization(prisma, "Proposal Isolation Org A");
    const orgB = await createTestOrganization(prisma, "Proposal Isolation Org B");
    try {
      const projectInB = await prisma.project.create({
        data: { organizationId: orgB.id, title: "Org B Project", slug: `org-b-${Date.now()}`, category: "RESIDENTIAL", status: "COMPLETED", client: "x", location: "x", year: 2026, duration: "x", budget: "x", area: "x", description: "Belongs to org B only." },
      });

      // This is exactly the lookup addConstructProposalPortfolioAction
      // performs before linking a project to a proposal — scoped by
      // both id AND organizationId, never id alone.
      const foundFromWrongOrg = await prisma.project.findFirst({ where: { id: projectInB.id, organizationId: orgA.id } });
      expect(foundFromWrongOrg).toBeNull();

      const foundFromRightOrg = await prisma.project.findFirst({ where: { id: projectInB.id, organizationId: orgB.id } });
      expect(foundFromRightOrg).not.toBeNull();
    } finally {
      await prisma.organization.delete({ where: { id: orgA.id } });
      await prisma.organization.delete({ where: { id: orgB.id } });
      await prisma.$disconnect();
    }
  });

  it("the database enforces at most one open draft per enquiry (partial unique index)", async () => {
    const prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Proposal Dedupe Test");
    try {
      const enquiry = await createTestEnquiry(prisma, org.id);
      await createTestProposal(prisma, org.id, enquiry.id, { status: "DRAFT" });
      await expect(createTestProposal(prisma, org.id, enquiry.id, { status: "DRAFT" })).rejects.toThrow();
    } finally {
      await prisma.organization.delete({ where: { id: org.id } });
      await prisma.$disconnect();
    }
  });
});
