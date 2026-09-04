import { NextResponse } from "next/server";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { syncSubscriptionToControlPlane } from "@/lib/control-sync";

// Ported from pets.shaoor-ai.com/app/api/cron/trial-expiry/route.ts —
// Construct had no cron of any kind before this. Vercel Cron hits this
// daily (register in vercel.json); Vercel automatically sends
// `Authorization: Bearer $CRON_SECRET` on cron-triggered requests when a
// CRON_SECRET env var is set, so this also doubles as a manual-trigger guard.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getConstructPrisma();

  // A trial with no card on file never got a subscriptions row past
  // TRIALING — those are the only orgs this sweep should touch. Orgs
  // already ACTIVE/PAST_DUE (real billing in progress) are left alone.
  const expired = await prisma.organization.findMany({
    where: {
      trialEndsAt: { not: null, lt: new Date() },
      plan: { isTrial: true },
      OR: [{ subscription: null }, { subscription: { status: "TRIALING" } }],
    },
    select: { id: true },
  });

  if (expired.length === 0) return NextResponse.json({ downgraded: 0 });

  await prisma.organization.updateMany({
    where: { id: { in: expired.map((o) => o.id) } },
    data: { planCode: "FREE", trialEndsAt: null },
  });
  await Promise.all(expired.map((o) => syncSubscriptionToControlPlane(o.id, "Trial expired, downgraded to Free")));

  return NextResponse.json({ downgraded: expired.length });
}
