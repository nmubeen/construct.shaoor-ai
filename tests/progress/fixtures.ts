import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/construct-client";

// Same disposable-organization-per-test-file convention as
// tests/proposals/fixtures.ts and tests/followups/fixtures.ts — no
// separate test database in this project. Note: a disposable
// organization created this way has NO control.product_instances row
// (it was never provisioned through the real signup flow), so
// getConstructEntitlements() naturally returns null for it and every
// boolean entitlement (including PRIVATE_PROJECT_PROGRESS) reads as
// false — see public-access.test.ts's own comment on why this is
// actually useful for testing the "entitlement missing" path, and why
// the "entitlement present, page resolves successfully" path can't be
// covered by a fixture-only test.
export function testPrisma() {
  return new PrismaClient({ datasourceUrl: process.env.CONSTRUCT_DATABASE_URL });
}

export async function createTestOrganization(prisma: PrismaClient, namePrefix: string) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prisma.organization.create({ data: { name: `${namePrefix} ${suffix}`, slug: `test-${suffix}`, status: "ACTIVE", planCode: "FREE" } });
}

export async function createTestUser(prisma: PrismaClient, namePrefix: string) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.user.create({ data: { id: randomUUID(), email: `${namePrefix.toLowerCase().replace(/\s+/g, "-")}-${suffix}@example.test`, fullName: namePrefix } });
}

export async function createTestEnquiry(prisma: PrismaClient, organizationId: string) {
  return prisma.contactMessage.create({ data: { organizationId, name: "Test Customer", email: "customer@example.test", message: "Looking to build a small extension." } });
}

export async function createTestProposal(prisma: PrismaClient, organizationId: string, enquiryId: string) {
  const suffix = Math.random().toString(36).slice(2, 10);
  return prisma.proposal.create({ data: { organizationId, enquiryId, reference: `PRP-TEST-${suffix}`, title: "Test proposal", token: `test-token-${suffix}-${Math.random().toString(36).slice(2, 20)}` } });
}

export async function createTestPortfolioProject(prisma: PrismaClient, organizationId: string) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.project.create({
    data: {
      organizationId, title: "Test Portfolio Project", slug: `test-project-${suffix}`, category: "RESIDENTIAL", status: "COMPLETED",
      client: "Confidential Client", location: "Test City", year: 2026, duration: "6 months", budget: "Confidential ₹99,00,000", area: "1000 sq ft",
      description: "A test project used only by the automated test suite.",
    },
  });
}

export async function createTestProgressProject(
  prisma: PrismaClient,
  organizationId: string,
  overrides: Partial<{ title: string; customerName: string; customerEmail: string; customerPhone: string; location: string; locationCustomerVisible: boolean; customerSummary: string; internalNotes: string }> = {},
) {
  return prisma.progressProject.create({
    data: {
      organizationId,
      title: overrides.title ?? "Test Build",
      customerName: overrides.customerName ?? "Test Customer",
      customerEmail: overrides.customerEmail ?? "private-contact@example.test",
      customerPhone: overrides.customerPhone ?? "+911234567890",
      location: overrides.location ?? "123 Confidential Street",
      locationCustomerVisible: overrides.locationCustomerVisible ?? false,
      customerSummary: overrides.customerSummary ?? "A lovely home extension.",
      internalNotes: overrides.internalNotes ?? "Confidential staff note — never leaks.",
    },
  });
}

export async function createTestMilestone(prisma: PrismaClient, organizationId: string, projectId: string, overrides: Partial<{ title: string; status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"; sortOrder: number }> = {}) {
  return prisma.progressMilestone.create({ data: { organizationId, projectId, title: overrides.title ?? "Foundation", status: overrides.status ?? "NOT_STARTED", sortOrder: overrides.sortOrder ?? 0 } });
}

export async function createTestUpdate(prisma: PrismaClient, organizationId: string, projectId: string, overrides: Partial<{ status: "DRAFT" | "PUBLISHED" | "WITHDRAWN"; title: string; updateDate: Date }> = {}) {
  return prisma.progressUpdate.create({
    data: {
      organizationId, projectId, updateDate: overrides.updateDate ?? new Date(), title: overrides.title ?? "Week 1 update", status: overrides.status ?? "DRAFT",
      workCompleted: "Cleared the site.", workInProgress: "Laying the foundation.", nextPlannedActivity: "Pour concrete.",
    },
  });
}
