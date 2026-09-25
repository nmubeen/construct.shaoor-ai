import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/construct-client";

// Same disposable-organization-per-test-file convention as
// tests/proposals/fixtures.ts — no separate test database in this
// project, so everything is created fresh under one throwaway
// organization and cascade-deleted in afterAll.
export function testPrisma() {
  return new PrismaClient({ datasourceUrl: process.env.CONSTRUCT_DATABASE_URL });
}

export async function createTestOrganization(prisma: PrismaClient, namePrefix: string, overrides: Partial<{ timezone: string }> = {}) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prisma.organization.create({
    data: { name: `${namePrefix} ${suffix}`, slug: `test-${suffix}`, status: "ACTIVE", planCode: "FREE", timezone: overrides.timezone ?? "Asia/Kolkata" },
  });
}

export async function createTestUser(prisma: PrismaClient, namePrefix: string) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.user.create({ data: { id: randomUUID(), email: `${namePrefix.toLowerCase().replace(/\s+/g, "-")}-${suffix}@example.test`, fullName: namePrefix } });
}

export async function createTestMembership(prisma: PrismaClient, organizationId: string, userId: string, role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER" = "EDITOR", status: "ACTIVE" | "INVITED" | "REMOVED" = "ACTIVE") {
  return prisma.membership.create({ data: { organizationId, userId, role, status } });
}

export async function createTestEnquiry(prisma: PrismaClient, organizationId: string, overrides: Partial<{ name: string }> = {}) {
  return prisma.contactMessage.create({
    data: { organizationId, name: overrides.name ?? "Test Customer", email: "customer@example.test", message: "Looking to build a small extension." },
  });
}

export async function createTestProposal(prisma: PrismaClient, organizationId: string, enquiryId: string, overrides: Partial<{ status: "DRAFT" | "PUBLISHED" | "REVOKED" }> = {}) {
  const suffix = Math.random().toString(36).slice(2, 10);
  return prisma.proposal.create({
    data: { organizationId, enquiryId, reference: `PRP-TEST-${suffix}`, title: "Test proposal", status: overrides.status ?? "DRAFT", token: `test-token-${suffix}-${Math.random().toString(36).slice(2, 20)}` },
  });
}

export async function createTestFollowUp(
  prisma: PrismaClient,
  organizationId: string,
  parent: { enquiryId: string } | { proposalId: string },
  overrides: Partial<{ title: string; dueAt: Date; status: "OPEN" | "COMPLETED" | "CANCELLED"; assigneeId: string | null; createdById: string | null }> = {},
) {
  return prisma.followUp.create({
    data: {
      organizationId,
      ...parent,
      title: overrides.title ?? "Call the customer",
      dueAt: overrides.dueAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: overrides.status ?? "OPEN",
      assigneeId: overrides.assigneeId ?? null,
      createdById: overrides.createdById ?? null,
    },
  });
}
