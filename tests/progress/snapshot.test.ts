import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/construct-client";

import { buildConstructProgressSnapshot } from "@/lib/services/construct-progress-snapshot.service";
import { createTestMilestone, createTestOrganization, createTestProgressProject, testPrisma } from "./fixtures";

describe("buildConstructProgressSnapshot: privacy exclusions", () => {
  let prisma: PrismaClient;
  let organizationId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Progress Snapshot Privacy Test");
    organizationId = org.id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("never includes customer email, phone or internal notes, even though they're set on the project", async () => {
    const project = await createTestProgressProject(prisma, organizationId, {
      customerEmail: "leak-check@example.test",
      customerPhone: "+919999999999",
      internalNotes: "SECRET_INTERNAL_MARKER never shown to the customer",
    });
    const snapshot = await buildConstructProgressSnapshot(project.id, 1);
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain("leak-check@example.test");
    expect(serialized).not.toContain("+919999999999");
    expect(serialized).not.toContain("SECRET_INTERNAL_MARKER");
    expect(snapshot).not.toHaveProperty("customerEmail");
    expect(snapshot).not.toHaveProperty("customerPhone");
    expect(snapshot).not.toHaveProperty("internalNotes");
  });

  it("excludes location unless locationCustomerVisible is explicitly true", async () => {
    const hiddenLocationProject = await createTestProgressProject(prisma, organizationId, { location: "SECRET_ADDRESS_MARKER", locationCustomerVisible: false });
    const hiddenSnapshot = await buildConstructProgressSnapshot(hiddenLocationProject.id, 1);
    expect(hiddenSnapshot.location).toBeNull();
    expect(JSON.stringify(hiddenSnapshot)).not.toContain("SECRET_ADDRESS_MARKER");

    const visibleLocationProject = await createTestProgressProject(prisma, organizationId, { location: "123 Visible Street", locationCustomerVisible: true });
    const visibleSnapshot = await buildConstructProgressSnapshot(visibleLocationProject.id, 1);
    expect(visibleSnapshot.location).toBe("123 Visible Street");
  });
});

describe("buildConstructProgressSnapshot: immutability and milestone content", () => {
  let prisma: PrismaClient;
  let organizationId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Progress Snapshot Immutability Test");
    organizationId = org.id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("a later edit to the working copy does not change an already-stored snapshot", async () => {
    const project = await createTestProgressProject(prisma, organizationId, { customerSummary: "Original summary" });
    const firstSnapshot = await buildConstructProgressSnapshot(project.id, 1);
    await prisma.progressSnapshot.create({ data: { organizationId, projectId: project.id, revisionNumber: 1, snapshot: firstSnapshot as unknown as object } });

    await prisma.progressProject.update({ where: { id: project.id }, data: { customerSummary: "Edited summary, never shown to a customer who already has revision 1" } });

    const stored = await prisma.progressSnapshot.findUniqueOrThrow({ where: { projectId_revisionNumber: { projectId: project.id, revisionNumber: 1 } } });
    const snapshot1 = stored.snapshot as unknown as { customerSummary: string };
    expect(snapshot1.customerSummary).toBe("Original summary");
  });

  it("republishing creates a new, separate revision rather than overwriting the previous one", async () => {
    const project = await createTestProgressProject(prisma, organizationId);
    await prisma.progressProject.update({ where: { id: project.id }, data: { title: "Version 1" } });
    const snap1 = await buildConstructProgressSnapshot(project.id, 1);
    await prisma.progressSnapshot.create({ data: { organizationId, projectId: project.id, revisionNumber: 1, snapshot: snap1 as unknown as object } });

    await prisma.progressProject.update({ where: { id: project.id }, data: { title: "Version 2" } });
    const snap2 = await buildConstructProgressSnapshot(project.id, 2);
    await prisma.progressSnapshot.create({ data: { organizationId, projectId: project.id, revisionNumber: 2, snapshot: snap2 as unknown as object } });

    const revisions = await prisma.progressSnapshot.findMany({ where: { projectId: project.id }, orderBy: { revisionNumber: "asc" } });
    expect(revisions).toHaveLength(2);
    expect((revisions[0].snapshot as unknown as { title: string }).title).toBe("Version 1");
    expect((revisions[1].snapshot as unknown as { title: string }).title).toBe("Version 2");
  });

  it("embeds milestones ordered by sortOrder, with their status frozen at publish time", async () => {
    const project = await createTestProgressProject(prisma, organizationId);
    await createTestMilestone(prisma, organizationId, project.id, { title: "Second", sortOrder: 1, status: "NOT_STARTED" });
    await createTestMilestone(prisma, organizationId, project.id, { title: "First", sortOrder: 0, status: "COMPLETED" });

    const snapshot = await buildConstructProgressSnapshot(project.id, 1);
    expect(snapshot.milestones.map((m) => m.title)).toEqual(["First", "Second"]);
    expect(snapshot.milestones[0].status).toBe("COMPLETED");
  });
});
