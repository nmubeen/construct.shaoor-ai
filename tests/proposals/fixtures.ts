import { PrismaClient } from "@prisma/construct-client";

// A disposable test organization (and everything under it) per test
// file — created fresh, torn down in afterAll via cascade delete on the
// organization row. There's no separate test database in this project
// (see vitest.config.ts's comment), so tests run against the real
// Supabase instance but never touch or depend on any pre-existing data.
export function testPrisma() {
  return new PrismaClient({ datasourceUrl: process.env.CONSTRUCT_DATABASE_URL });
}

export async function createTestOrganization(prisma: PrismaClient, namePrefix: string) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prisma.organization.create({
    data: { name: `${namePrefix} ${suffix}`, slug: `test-${suffix}`, status: "ACTIVE", planCode: "FREE" },
  });
}

export async function createTestEnquiry(prisma: PrismaClient, organizationId: string, overrides: Partial<{ name: string; email: string; serviceId: string | null; message: string }> = {}) {
  return prisma.contactMessage.create({
    data: {
      organizationId,
      name: overrides.name ?? "Test Customer",
      email: overrides.email ?? "customer@example.test",
      phone: "+911234567890",
      message: overrides.message ?? "Looking to build a small extension.",
      serviceId: overrides.serviceId ?? null,
      projectLocation: "Test City",
      consentAt: new Date(),
      answers: [{ questionId: "q1", question: "What is the approximate area?", type: "short_text", answer: "1200 sq ft" }],
    },
  });
}

export async function createTestProject(prisma: PrismaClient, organizationId: string, overrides: Partial<{ title: string; isSample: boolean; isActive: boolean }> = {}) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.project.create({
    data: {
      organizationId,
      title: overrides.title ?? "Test Project",
      slug: `test-project-${suffix}`,
      category: "RESIDENTIAL",
      status: "COMPLETED",
      client: "Confidential",
      location: "Test City",
      year: 2026,
      duration: "6 months",
      budget: "Confidential",
      area: "1000 sq ft",
      description: "A test project used only by the automated test suite.",
      isActive: overrides.isActive ?? true,
      isSample: overrides.isSample ?? false,
    },
  });
}

export async function createTestProposal(prisma: PrismaClient, organizationId: string, enquiryId: string, overrides: Partial<{ status: "DRAFT" | "PUBLISHED" | "REVOKED"; expiresAt: Date | null; token: string }> = {}) {
  const suffix = Math.random().toString(36).slice(2, 10);
  return prisma.proposal.create({
    data: {
      organizationId,
      enquiryId,
      reference: `PRP-TEST-${suffix}`,
      title: "Test proposal",
      status: overrides.status ?? "DRAFT",
      expiresAt: overrides.expiresAt ?? null,
      token: overrides.token ?? `test-token-${suffix}-${Math.random().toString(36).slice(2, 20)}`,
    },
  });
}
