import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { getRazorpay } from "@/lib/razorpay";

// Ported from pets.shaoor-ai.com/app/api/razorpay/subscription/route.ts —
// creates a Razorpay Subscription and hands the id back to the browser,
// which opens Razorpay's Checkout.js modal for it
// (components/dashboard/billing/RazorpayCheckout.tsx). Only the
// workspace Owner may do this.
//
// Razorpay subscriptions require a total_count (number of billing
// cycles) — there's no "renews forever" option, so this uses a
// long-but-finite count (10 years) and treats cancellation, not expiry,
// as the real end.
const TOTAL_CYCLES = { monthly: 120, annual: 10 } as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { organizationId, planCode, interval } = (await request.json()) as {
    organizationId: string;
    planCode: string;
    interval: "monthly" | "annual";
  };

  const prisma = getConstructPrisma();
  const membership = await prisma.membership.findFirst({
    where: { organizationId, userId: user.id, status: "ACTIVE" },
    select: { role: true },
  });
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Only the workspace owner can manage billing." }, { status: 403 });
  }

  const plan = await prisma.plan.findUnique({
    where: { code: planCode },
    select: { code: true, razorpayPlanIdMonthly: true, razorpayPlanIdAnnual: true },
  });
  const razorpayPlanId = interval === "annual" ? plan?.razorpayPlanIdAnnual : plan?.razorpayPlanIdMonthly;
  if (!razorpayPlanId) {
    return NextResponse.json({ error: "This plan isn't purchasable online yet." }, { status: 400 });
  }

  try {
    const subscription = await getRazorpay().subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: TOTAL_CYCLES[interval],
      customer_notify: 1,
      notes: { organization_id: organizationId, plan_code: planCode },
    });

    return NextResponse.json({ subscriptionId: subscription.id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
