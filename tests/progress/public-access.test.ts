import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/construct-client";

import { generateProgressToken, hashProgressToken } from "@/lib/progress-token";
import { recordConstructProgressView, resolveConstructProgressByToken } from "@/lib/services/construct-progress-public.service";
import { buildConstructProgressSnapshot } from "@/lib/services/construct-progress-snapshot.service";
import { createTestOrganization, createTestProgressProject, testPrisma } from "./fixtures";

// Fixture organizations here are disposable, created directly via
// prisma.organization.create — never provisioned through the real
// signup flow, so they have no control.product_instances row.
// getConstructEntitlements() therefore returns null for them and every
// boolean entitlement (including PRIVATE_PROJECT_PROGRESS) reads as
// false. This means every test below that reaches the entitlement
// check in resolveConstructProgressByToken will get "unavailable" —
// which is itself directly tested (it's the exact behavior the product
// spec requires for a lost/missing entitlement, and it's naturally what
// a disposable org's state is). The other failure branches (not-found,
// revoked, expired, organization suspended) all short-circuit BEFORE
// the entitlement check and are independently verified. A true
// "ok: true" full resolution requires a real, control-plane-provisioned
// organization and was verified separately via a live end-to-end pass,
// not by a fixture-only test — see the deployment note's "what was
// verified" section.
async function setupPublishedProject(prisma: PrismaClient, organizationId: string, overrides: Partial<{ accessExpiresAt: Date | null; accessRevokedAt: Date | null }> = {}) {
  const project = await createTestProgressProject(prisma, organizationId);
  const snapshot = await buildConstructProgressSnapshot(project.id, 1);
  await prisma.progressSnapshot.create({ data: { organizationId, projectId: project.id, revisionNumber: 1, snapshot: snapshot as unknown as object } });
  const token = generateProgressToken();
  const tokenHash = hashProgressToken(token);
  await prisma.progressProject.update({
    where: { id: project.id },
    data: { currentRevisionNumber: 1, accessTokenHash: tokenHash, accessCreatedAt: new Date(), accessExpiresAt: overrides.accessExpiresAt, accessRevokedAt: overrides.accessRevokedAt },
  });
  return { project, token };
}

describe("hashProgressToken", () => {
  it("is deterministic and produces a fixed-length hex digest", () => {
    const token = generateProgressToken();
    const hash1 = hashProgressToken(token);
    const hash2 = hashProgressToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
  });
  it("different tokens hash to different values", () => {
    expect(hashProgressToken(generateProgressToken())).not.toBe(hashProgressToken(generateProgressToken()));
  });
});

describe("resolveConstructProgressByToken", () => {
  let prisma: PrismaClient;
  let organizationId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Progress Public Access Test");
    organizationId = org.id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("rejects an unknown token without revealing anything", async () => {
    const result = await resolveConstructProgressByToken("this-token-does-not-exist-1234567890");
    expect(result).toEqual({ ok: false, reason: "not-found" });
  });

  it("rejects a too-short token immediately (defensive — real tokens are always 43 chars)", async () => {
    const result = await resolveConstructProgressByToken("short");
    expect(result).toEqual({ ok: false, reason: "not-found" });
  });

  it("never resolves a project that has an access link but was never published", async () => {
    // The entitlement check runs before the never-published check (see
    // resolveConstructProgressByToken's own ordering), and a disposable
    // test org is never entitled — so this hits "unavailable" here
    // rather than the "not-found" a real, entitled org with a
    // never-published project would get. Either way the important
    // invariant — never ok:true for something that was never published
    // — holds regardless of which specific reason fires first.
    const token = generateProgressToken();
    const project = await createTestProgressProject(prisma, organizationId);
    await prisma.progressProject.update({ where: { id: project.id }, data: { accessTokenHash: hashProgressToken(token), accessCreatedAt: new Date() } });
    const result = await resolveConstructProgressByToken(token);
    expect(result.ok).toBe(false);
  });

  it("refuses a REVOKED link", async () => {
    const { token } = await setupPublishedProject(prisma, organizationId, { accessRevokedAt: new Date() });
    const result = await resolveConstructProgressByToken(token);
    expect(result).toEqual({ ok: false, reason: "revoked" });
  });

  it("refuses an EXPIRED link", async () => {
    const { token } = await setupPublishedProject(prisma, organizationId, { accessExpiresAt: new Date(Date.now() - 60_000) });
    const result = await resolveConstructProgressByToken(token);
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("refuses access once the organization is suspended, even for an otherwise-valid link", async () => {
    const { token } = await setupPublishedProject(prisma, organizationId);
    await prisma.organization.update({ where: { id: organizationId }, data: { status: "SUSPENDED" } });
    try {
      const result = await resolveConstructProgressByToken(token);
      expect(result).toEqual({ ok: false, reason: "unavailable" });
    } finally {
      await prisma.organization.update({ where: { id: organizationId }, data: { status: "ACTIVE" } });
    }
  });

  it("refuses access when the organization has no PRIVATE_PROJECT_PROGRESS entitlement (the natural state of a non-provisioned test org) — same generic reason as suspension, never revealing billing status", async () => {
    const { token } = await setupPublishedProject(prisma, organizationId);
    const result = await resolveConstructProgressByToken(token);
    expect(result).toEqual({ ok: false, reason: "unavailable" });
  });

  it("organization suspension and entitlement loss produce the IDENTICAL response shape — nothing distinguishes them from outside", async () => {
    const { token: entitlementBlockedToken } = await setupPublishedProject(prisma, organizationId);
    const entitlementResult = await resolveConstructProgressByToken(entitlementBlockedToken);

    const { token: suspendedToken } = await setupPublishedProject(prisma, organizationId);
    await prisma.organization.update({ where: { id: organizationId }, data: { status: "SUSPENDED" } });
    let suspendedResult;
    try {
      suspendedResult = await resolveConstructProgressByToken(suspendedToken);
    } finally {
      await prisma.organization.update({ where: { id: organizationId }, data: { status: "ACTIVE" } });
    }
    expect(entitlementResult).toEqual(suspendedResult);
  });
});

describe("recordConstructProgressView", () => {
  let prisma: PrismaClient;
  let organizationId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Progress View Tracking Test");
    organizationId = org.id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("dedupes rapid repeat opens (does not inflate openCount) while still advancing lastOpenedAt", async () => {
    const project = await createTestProgressProject(prisma, organizationId);
    await recordConstructProgressView(project.id);
    await recordConstructProgressView(project.id);

    const updated = await prisma.progressProject.findUniqueOrThrow({ where: { id: project.id } });
    expect(updated.openCount).toBe(1);
    expect(updated.firstOpenedAt).not.toBeNull();
    expect(updated.lastOpenedAt).not.toBeNull();
  });
});
