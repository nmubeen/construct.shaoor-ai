import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/construct-client";

import { getEligibleAssignees, isAssigneeEligible, needsReassignment } from "@/lib/services/construct-followup.service";
import { createTestMembership, createTestOrganization, createTestUser, testPrisma } from "./fixtures";

describe("assignee eligibility", () => {
  let prisma: PrismaClient;
  let organizationId: string;
  let ownerId: string, editorId: string, viewerId: string, invitedId: string, removedId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Followup Eligibility Test");
    organizationId = org.id;

    const [owner, editor, viewer, invited, removed] = await Promise.all([
      createTestUser(prisma, "Owner User"),
      createTestUser(prisma, "Editor User"),
      createTestUser(prisma, "Viewer User"),
      createTestUser(prisma, "Invited User"),
      createTestUser(prisma, "Removed User"),
    ]);
    ownerId = owner.id; editorId = editor.id; viewerId = viewer.id; invitedId = invited.id; removedId = removed.id;

    await Promise.all([
      createTestMembership(prisma, organizationId, ownerId, "OWNER", "ACTIVE"),
      createTestMembership(prisma, organizationId, editorId, "EDITOR", "ACTIVE"),
      createTestMembership(prisma, organizationId, viewerId, "VIEWER", "ACTIVE"),
      createTestMembership(prisma, organizationId, invitedId, "EDITOR", "INVITED"),
      createTestMembership(prisma, organizationId, removedId, "EDITOR", "REMOVED"),
    ]);
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("lists only ACTIVE, non-VIEWER members as eligible assignees", async () => {
    const eligible = await getEligibleAssignees(organizationId);
    const ids = eligible.map((a) => a.id);
    expect(ids).toContain(ownerId);
    expect(ids).toContain(editorId);
    expect(ids).not.toContain(viewerId);
    expect(ids).not.toContain(invitedId);
    expect(ids).not.toContain(removedId);
  });

  it("isAssigneeEligible agrees with the list for each case", async () => {
    expect(await isAssigneeEligible(organizationId, ownerId)).toBe(true);
    expect(await isAssigneeEligible(organizationId, editorId)).toBe(true);
    expect(await isAssigneeEligible(organizationId, viewerId)).toBe(false);
    expect(await isAssigneeEligible(organizationId, invitedId)).toBe(false);
    expect(await isAssigneeEligible(organizationId, removedId)).toBe(false);
  });

  it("a user id from a different organization is never eligible, even if that user is an Owner elsewhere", async () => {
    const otherOrg = await createTestOrganization(prisma, "Followup Eligibility Other Org");
    const otherOwner = await createTestUser(prisma, "Other Org Owner");
    await createTestMembership(prisma, otherOrg.id, otherOwner.id, "OWNER", "ACTIVE");
    try {
      expect(await isAssigneeEligible(organizationId, otherOwner.id)).toBe(false);
      const eligible = await getEligibleAssignees(organizationId);
      expect(eligible.map((a) => a.id)).not.toContain(otherOwner.id);
    } finally {
      await prisma.organization.delete({ where: { id: otherOrg.id } });
    }
  });

  it("needsReassignment is true for a null assignee and for an ineligible one, false for an eligible one", async () => {
    expect(await needsReassignment(organizationId, null)).toBe(true);
    expect(await needsReassignment(organizationId, viewerId)).toBe(true);
    expect(await needsReassignment(organizationId, removedId)).toBe(true);
    expect(await needsReassignment(organizationId, editorId)).toBe(false);
  });
});
