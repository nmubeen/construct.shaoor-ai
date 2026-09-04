import "server-only";
import { Prisma } from "@prisma/construct-client";
import { getConstructPrisma } from "@/lib/construct-prisma";

// Best-effort mirror of an organization's subscription state into
// shaoor-ai.com's shared control plane (/admin/subscriptions) — this
// app's own organizations/subscriptions tables stay the actual source of
// truth for gating; this is purely for the parent site's cross-product
// admin dashboard. Deliberately never throws into the caller — a failed
// sync just leaves the dashboard stale until the next lifecycle event,
// not a broken checkout/cancellation for the user.
//
// Unlike pets.shaoor-ai.com (PostgREST-only, needs a wrapper RPC — see
// its lib/control-sync.ts), this app's Prisma connection already has
// direct cross-schema SQL access to `control` (same technique the signup
// trigger and construct.activate_shaoor_construct_account already use),
// so this calls the shared sync function straight, no wrapper needed.
export async function syncSubscriptionToControlPlane(organizationId: string, reason: string) {
  try {
    const prisma = getConstructPrisma();
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { plan: true, subscription: true, memberships: { where: { role: "OWNER" }, include: { user: true }, take: 1 } },
    });
    if (!org) return;

    const owner = org.memberships[0]?.user ?? null;
    const status = org.subscription?.status ?? "TRIALING";

    await prisma.$queryRaw(Prisma.sql`
      SELECT control.sync_shaoor_construct_subscription(
        ${org.id}::uuid, ${org.name}, ${owner?.id ?? null}::uuid, ${owner?.email ?? null},
        ${org.planCode}, ${status}, ${org.trialEndsAt}::timestamptz,
        NULL::timestamptz, ${org.subscription?.currentPeriodEnd ?? null}::timestamptz,
        ${reason}, ${`construct-sync-${organizationId}-${Date.now()}`}
      )
    `);
  } catch (error) {
    console.error("Control plane sync failed (non-blocking)", error);
  }
}
