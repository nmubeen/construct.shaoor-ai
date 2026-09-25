import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/construct-client";

import { createTestOrganization, createTestProgressProject, createTestUpdate, testPrisma } from "./fixtures";

describe("ProgressPhoto: exactly-one-source database constraint", () => {
  let prisma: PrismaClient;
  let organizationId: string;
  let updateId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Progress Photo Constraint Test");
    organizationId = org.id;
    const project = await createTestProgressProject(prisma, organizationId);
    const update = await createTestUpdate(prisma, organizationId, project.id);
    updateId = update.id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("rejects a photo with NEITHER a storage path nor a public image URL", async () => {
    await expect(prisma.progressPhoto.create({ data: { organizationId, updateId } })).rejects.toThrow();
  });

  it("rejects a photo with BOTH a storage path and a public image URL", async () => {
    await expect(
      prisma.progressPhoto.create({ data: { organizationId, updateId, storagePath: `${organizationId}/${updateId}/x.jpg`, publicImageUrl: "https://example.test/public.jpg" } }),
    ).rejects.toThrow();
  });

  it("accepts a photo with exactly a storage path (private upload)", async () => {
    const photo = await prisma.progressPhoto.create({ data: { organizationId, updateId, storagePath: `${organizationId}/${updateId}/private.jpg` } });
    expect(photo.id).toBeTruthy();
  });

  it("accepts a photo with exactly a public image URL (public reference)", async () => {
    const photo = await prisma.progressPhoto.create({ data: { organizationId, updateId, publicImageUrl: "https://example.test/public.jpg" } });
    expect(photo.id).toBeTruthy();
  });
});

describe("ProgressProject cascades and cross-org link behavior", () => {
  let prisma: PrismaClient;
  let organizationId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Progress Cascade Test");
    organizationId = org.id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("deleting a project cascades its milestones, updates, photos and snapshots", async () => {
    const project = await createTestProgressProject(prisma, organizationId);
    const milestone = await prisma.progressMilestone.create({ data: { organizationId, projectId: project.id, title: "Roof" } });
    const update = await createTestUpdate(prisma, organizationId, project.id);
    const photo = await prisma.progressPhoto.create({ data: { organizationId, updateId: update.id, storagePath: `${organizationId}/${update.id}/x.jpg` } });
    const snapshot = await prisma.progressSnapshot.create({ data: { organizationId, projectId: project.id, revisionNumber: 1, snapshot: { title: "x" } } });

    await prisma.progressProject.delete({ where: { id: project.id } });

    expect(await prisma.progressMilestone.findUnique({ where: { id: milestone.id } })).toBeNull();
    expect(await prisma.progressUpdate.findUnique({ where: { id: update.id } })).toBeNull();
    expect(await prisma.progressPhoto.findUnique({ where: { id: photo.id } })).toBeNull();
    expect(await prisma.progressSnapshot.findUnique({ where: { id: snapshot.id } })).toBeNull();
  });

  it("deleting an update (e.g. discarding a draft) cascades its photos", async () => {
    const project = await createTestProgressProject(prisma, organizationId);
    const update = await createTestUpdate(prisma, organizationId, project.id);
    const photo = await prisma.progressPhoto.create({ data: { organizationId, updateId: update.id, storagePath: `${organizationId}/${update.id}/x.jpg` } });

    await prisma.progressUpdate.delete({ where: { id: update.id } });

    expect(await prisma.progressPhoto.findUnique({ where: { id: photo.id } })).toBeNull();
  });

  it("optional cross-links (enquiry/proposal/portfolio project) SET NULL rather than blocking deletion of the linked record", async () => {
    const enquiry = await prisma.contactMessage.create({ data: { organizationId, name: "Link Test", email: "x@example.test", message: "x" } });
    const project = await createTestProgressProject(prisma, organizationId);
    await prisma.progressProject.update({ where: { id: project.id }, data: { enquiryId: enquiry.id } });

    await prisma.contactMessage.delete({ where: { id: enquiry.id } });

    const reloaded = await prisma.progressProject.findUniqueOrThrow({ where: { id: project.id } });
    expect(reloaded.enquiryId).toBeNull();
  });

  it("a foreign-key link to a record from a DIFFERENT organization is permitted at the DB level — cross-org isolation is an application-level guard, not a DB one (same documented precedent as FollowUp)", async () => {
    const otherOrg = await createTestOrganization(prisma, "Progress Cross Org");
    try {
      const otherEnquiry = await prisma.contactMessage.create({ data: { organizationId: otherOrg.id, name: "Other Org", email: "x@example.test", message: "x" } });
      const project = await createTestProgressProject(prisma, organizationId);
      // The FK alone doesn't check which org owns the enquiry — the real
      // guard is validateOptionalLinks() in construct-progress.actions.ts,
      // which always re-checks `where: { id, organizationId }` before
      // ever writing this field.
      const linked = await prisma.progressProject.update({ where: { id: project.id }, data: { enquiryId: otherEnquiry.id } });
      expect(linked.enquiryId).toBe(otherEnquiry.id);
      const validated = await prisma.contactMessage.findFirst({ where: { id: otherEnquiry.id, organizationId }, select: { id: true } });
      expect(validated).toBeNull();
    } finally {
      await prisma.organization.delete({ where: { id: otherOrg.id } });
    }
  });

  it("rejects a project referencing a nonexistent enquiry id", async () => {
    const project = await createTestProgressProject(prisma, organizationId);
    await expect(prisma.progressProject.update({ where: { id: project.id }, data: { enquiryId: randomUUID() } })).rejects.toThrow();
  });
});
