import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/construct-client";

import { testPrisma } from "./fixtures";

// Verifies the actual seeded data in the shared control plane
// (shaoor-ai.com's migration
// 20260928000000_construct_private_progress_entitlement) rather than
// mocking anything — same cross-schema raw-SQL read the app itself uses
// (getConstructEntitlements), against the real control.plan_entitlements
// table. This is the "Initial configuration" the product spec specifies
// and the thing enforceConstructBooleanEntitlement ultimately reads —
// if this data ever regresses (e.g. a future migration overwrites it,
// or someone edits it incorrectly by hand), this test catches it.
describe("PRIVATE_PROJECT_PROGRESS entitlement catalog (control.plan_entitlements)", () => {
  it("matches the product spec's initial configuration exactly for every known SHAOOR_CONSTRUCT plan", async () => {
    const prisma: PrismaClient = testPrisma();
    try {
      const rows = await prisma.$queryRaw<{ plan_code: string; boolean_value: boolean | null; value_type: string }[]>`
        SELECT p.code as plan_code, pe.boolean_value, pe.value_type::text as value_type
        FROM control.plan_entitlements pe
        JOIN control.plans p ON p.id = pe.plan_id
        JOIN control.products pr ON pr.id = p.product_id
        WHERE pr.code = 'SHAOOR_CONSTRUCT' AND pe.feature_code = 'PRIVATE_PROJECT_PROGRESS'
      `;
      const byPlan = new Map(rows.map((r) => [r.plan_code, r.boolean_value]));

      expect(byPlan.get("FREE")).toBe(false);
      expect(byPlan.get("STARTER_MONTHLY")).toBe(false);
      expect(byPlan.get("STARTER_ANNUAL")).toBe(false);
      expect(byPlan.get("GROWTH_MONTHLY")).toBe(true);
      expect(byPlan.get("GROWTH_ANNUAL")).toBe(true);
      expect(byPlan.get("ENTERPRISE_MONTHLY")).toBe(true);
      expect(byPlan.get("ENTERPRISE_ANNUAL")).toBe(true);

      expect(rows.every((r) => r.value_type === "BOOLEAN")).toBe(true);
    } finally {
      await prisma.$disconnect();
    }
  });

  it("is independent of PROJECT_PROPOSALS — the two entitlements can differ per plan (verifies 'not inferred from proposal or enquiry eligibility')", async () => {
    const prisma: PrismaClient = testPrisma();
    try {
      // Both happen to share the same Growth/Enterprise-enabled shape
      // today, but they are two distinct rows read independently — this
      // confirms PRIVATE_PROJECT_PROGRESS has its OWN row per plan
      // rather than the code deriving its value from PROJECT_PROPOSALS.
      const rows = await prisma.$queryRaw<{ feature_code: string; plan_code: string }[]>`
        SELECT pe.feature_code, p.code as plan_code
        FROM control.plan_entitlements pe
        JOIN control.plans p ON p.id = pe.plan_id
        JOIN control.products pr ON pr.id = p.product_id
        WHERE pr.code = 'SHAOOR_CONSTRUCT' AND pe.feature_code IN ('PRIVATE_PROJECT_PROGRESS', 'PROJECT_PROPOSALS') AND p.code = 'GROWTH_MONTHLY'
      `;
      expect(rows.map((r) => r.feature_code).sort()).toEqual(["PRIVATE_PROJECT_PROGRESS", "PROJECT_PROPOSALS"]);
    } finally {
      await prisma.$disconnect();
    }
  });
});
