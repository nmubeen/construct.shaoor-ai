import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { syncSubscriptionToControlPlane } from "@/lib/control-sync";

// Ported from pets.shaoor-ai.com/app/api/razorpay/webhook/route.ts — the
// only writer of construct.subscriptions. No user session exists on this
// request; Prisma's connection here already has full write access (same
// as everywhere else in this app), so no service-role-equivalent client
// is needed the way Pets' PostgREST setup requires one.
//
// Signature check uses the SDK's own validateWebhookSignature (HMAC-SHA256
// over the raw body, keyed with the webhook secret from the Razorpay
// dashboard, checked against the `x-razorpay-signature` header) — proof
// this call actually came from Razorpay before trusting any of it.
const STATUS_MAP: Record<string, "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED"> = {
  created: "TRIALING",
  authenticated: "TRIALING",
  active: "ACTIVE",
  charged: "ACTIVE",
  pending: "PAST_DUE",
  halted: "PAST_DUE",
  cancelled: "CANCELED",
  completed: "CANCELED",
  expired: "CANCELED",
};

type RazorpaySubscriptionEntity = {
  id: string;
  customer_id?: string;
  status: string;
  current_end?: number | null;
  notes?: { organization_id?: string; plan_code?: string };
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const valid = Razorpay.validateWebhookSignature(body, signature, secret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(body) as {
    event: string;
    payload?: { subscription?: { entity: RazorpaySubscriptionEntity } };
  };

  const subscription = event.payload?.subscription?.entity;
  const organizationId = subscription?.notes?.organization_id;

  if (subscription && organizationId) {
    const prisma = getConstructPrisma();
    const status = STATUS_MAP[subscription.status] ?? "ACTIVE";
    const currentPeriodEnd = subscription.current_end ? new Date(subscription.current_end * 1000) : null;

    await prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        status,
        currentPeriodEnd,
        razorpayCustomerId: subscription.customer_id ?? null,
        razorpaySubscriptionId: subscription.id,
      },
      update: {
        status,
        currentPeriodEnd,
        razorpayCustomerId: subscription.customer_id ?? null,
        razorpaySubscriptionId: subscription.id,
      },
    });

    if (status === "ACTIVE" || status === "TRIALING") {
      const planCode = subscription.notes?.plan_code;
      if (planCode) {
        await prisma.organization.update({ where: { id: organizationId }, data: { planCode, trialEndsAt: null } });
      }
    } else if (status === "CANCELED") {
      await prisma.organization.update({ where: { id: organizationId }, data: { planCode: "FREE", trialEndsAt: null } });
    }

    await syncSubscriptionToControlPlane(organizationId, `Razorpay webhook: ${event.event}`);
  }

  return NextResponse.json({ received: true });
}
