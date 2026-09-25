import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/construct-client";

import { getMilestoneCompletion, getProgressLinkCandidates, getProgressPendingChanges, listProgressProjects } from "@/lib/services/construct-progress.service";
import { buildConstructProgressSnapshot } from "@/lib/services/construct-progress-snapshot.service";
import { createTestEnquiry, createTestMilestone, createTestOrganization, createTestPortfolioProject, createTestProgressProject, createTestProposal, testPrisma } from "./fixtures";

describe("getProgressLinkCandidates: organization scoping", () => {
  let prisma: PrismaClient;
  let orgA: string;
  let orgB: string;

  beforeAll(async () => {
    prisma = testPrisma();
    orgA = (await createTestOrganization(prisma, "Progress Link Candidates A")).id;
    orgB = (await createTestOrganization(prisma, "Progress Link Candidates B")).id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: orgA } });
    await prisma.organization.delete({ where: { id: orgB } });
    await prisma.$disconnect();
  });

  it("never returns another organization's enquiries, proposals or portfolio projects as link candidates", async () => {
    const enquiryB = await createTestEnquiry(prisma, orgB);
    const proposalB = await createTestProposal(prisma, orgB, enquiryB.id);
    const portfolioB = await createTestPortfolioProject(prisma, orgB);

    const candidates = await getProgressLinkCandidates(orgA);
    expect(candidates.enquiries.map((e) => e.id)).not.toContain(enquiryB.id);
    expect(candidates.proposals.map((p) => p.id)).not.toContain(proposalB.id);
    expect(candidates.portfolioProjects.map((p) => p.id)).not.toContain(portfolioB.id);
  });

  it("returns this organization's own enquiries, proposals and portfolio projects", async () => {
    const enquiryA = await createTestEnquiry(prisma, orgA);
    const proposalA = await createTestProposal(prisma, orgA, enquiryA.id);
    const portfolioA = await createTestPortfolioProject(prisma, orgA);

    const candidates = await getProgressLinkCandidates(orgA);
    expect(candidates.enquiries.map((e) => e.id)).toContain(enquiryA.id);
    expect(candidates.proposals.map((p) => p.id)).toContain(proposalA.id);
    expect(candidates.portfolioProjects.map((p) => p.id)).toContain(portfolioA.id);
  });
});

describe("listProgressProjects", () => {
  let prisma: PrismaClient;
  let organizationId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    organizationId = (await createTestOrganization(prisma, "Progress List Test")).id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("filters by lifecycle and by search text (customer or title)", async () => {
    const active = await createTestProgressProject(prisma, organizationId, { title: "Riverside Villa", customerName: "Amit Shah" });
    await prisma.progressProject.update({ where: { id: active.id }, data: { lifecycle: "ACTIVE" } });
    const planned = await createTestProgressProject(prisma, organizationId, { title: "Hilltop Bungalow", customerName: "Priya Rao" });

    const activeOnly = await listProgressProjects(organizationId, { lifecycle: "ACTIVE" });
    expect(activeOnly.map((p) => p.id)).toContain(active.id);
    expect(activeOnly.map((p) => p.id)).not.toContain(planned.id);

    const searchByCustomer = await listProgressProjects(organizationId, { search: "Priya" });
    expect(searchByCustomer.map((p) => p.id)).toEqual([planned.id]);

    const searchByTitle = await listProgressProjects(organizationId, { search: "Riverside" });
    expect(searchByTitle.map((p) => p.id)).toEqual([active.id]);
  });

  it("reports customerAccessEnabled correctly for no-link / active-link / revoked / expired states", async () => {
    const noLink = await createTestProgressProject(prisma, organizationId, { title: "No Link Project" });
    const active = await createTestProgressProject(prisma, organizationId, { title: "Active Link Project" });
    await prisma.progressProject.update({ where: { id: active.id }, data: { accessTokenHash: "hash-active", accessCreatedAt: new Date() } });
    const revoked = await createTestProgressProject(prisma, organizationId, { title: "Revoked Link Project" });
    await prisma.progressProject.update({ where: { id: revoked.id }, data: { accessTokenHash: "hash-revoked", accessCreatedAt: new Date(), accessRevokedAt: new Date() } });
    const expired = await createTestProgressProject(prisma, organizationId, { title: "Expired Link Project" });
    await prisma.progressProject.update({ where: { id: expired.id }, data: { accessTokenHash: "hash-expired", accessCreatedAt: new Date(), accessExpiresAt: new Date(Date.now() - 60_000) } });

    const rows = await listProgressProjects(organizationId, {});
    const byId = new Map(rows.map((r) => [r.id, r]));
    expect(byId.get(noLink.id)?.customerAccessEnabled).toBe(false);
    expect(byId.get(active.id)?.customerAccessEnabled).toBe(true);
    expect(byId.get(revoked.id)?.customerAccessEnabled).toBe(false);
    expect(byId.get(expired.id)?.customerAccessEnabled).toBe(false);
  });
});

describe("getProgressPendingChanges", () => {
  let prisma: PrismaClient;
  let organizationId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    organizationId = (await createTestOrganization(prisma, "Progress Pending Changes Test")).id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("reports hasNeverPublished for a brand-new project", async () => {
    const project = await createTestProgressProject(prisma, organizationId);
    const state = await getProgressPendingChanges(organizationId, project.id);
    expect(state.hasNeverPublished).toBe(true);
    expect(state.hasPendingChanges).toBe(true);
  });

  it("reports no pending changes right after a publish, then true again once the working copy is edited", async () => {
    const project = await createTestProgressProject(prisma, organizationId);
    const snapshot = await buildConstructProgressSnapshot(project.id, 1);
    await prisma.progressSnapshot.create({ data: { organizationId, projectId: project.id, revisionNumber: 1, snapshot: snapshot as unknown as object } });

    const afterPublish = await getProgressPendingChanges(organizationId, project.id);
    expect(afterPublish.hasPendingChanges).toBe(false);

    // Ensure the edit's updatedAt is strictly after publishedAt even on a
    // fast test run (timestamp resolution).
    await new Promise((resolve) => setTimeout(resolve, 10));
    await prisma.progressProject.update({ where: { id: project.id }, data: { customerSummary: "Edited after publish" } });

    const afterEdit = await getProgressPendingChanges(organizationId, project.id);
    expect(afterEdit.summaryChanged).toBe(true);
    expect(afterEdit.hasPendingChanges).toBe(true);
  });

  it("detects a milestone-only change as a pending change even when the project row itself wasn't touched", async () => {
    const project = await createTestProgressProject(prisma, organizationId);
    const milestone = await createTestMilestone(prisma, organizationId, project.id);
    const snapshot = await buildConstructProgressSnapshot(project.id, 1);
    await prisma.progressSnapshot.create({ data: { organizationId, projectId: project.id, revisionNumber: 1, snapshot: snapshot as unknown as object } });

    await new Promise((resolve) => setTimeout(resolve, 10));
    await prisma.progressMilestone.update({ where: { id: milestone.id }, data: { status: "COMPLETED" } });

    const state = await getProgressPendingChanges(organizationId, project.id);
    expect(state.milestonesChanged).toBe(true);
    expect(state.hasPendingChanges).toBe(true);
  });
});

describe("getMilestoneCompletion", () => {
  it("counts completed vs total milestones for a project", async () => {
    const prisma = testPrisma();
    const organizationId = (await createTestOrganization(prisma, "Progress Milestone Completion Test")).id;
    try {
      const project = await createTestProgressProject(prisma, organizationId);
      await createTestMilestone(prisma, organizationId, project.id, { status: "COMPLETED", sortOrder: 0 });
      await createTestMilestone(prisma, organizationId, project.id, { status: "IN_PROGRESS", sortOrder: 1 });
      await createTestMilestone(prisma, organizationId, project.id, { status: "NOT_STARTED", sortOrder: 2 });

      const result = await getMilestoneCompletion(organizationId, project.id);
      expect(result).toEqual({ completed: 1, total: 3 });
    } finally {
      await prisma.organization.delete({ where: { id: organizationId } });
      await prisma.$disconnect();
    }
  });
});

