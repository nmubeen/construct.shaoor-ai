"use server";

// Ported from pets.shaoor-ai.com/lib/actions/billing.ts. Razorpay has no
// hosted "Customer Portal" the way Stripe does — this is the hand-built
// equivalent for the one thing that matters most: cancelling.
// cancel_at_cycle_end keeps the workspace on its current plan through the
// paid period already covered; the webhook (subscription.cancelled, once
// the cycle actually ends) is what flips plan_code to FREE.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { getRazorpay } from "@/lib/razorpay";
import { syncSubscriptionToControlPlane } from "@/lib/control-sync";

export async function cancelConstructSubscription(organizationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const prisma = getConstructPrisma();
  const membership = await prisma.membership.findFirst({
    where: { organizationId, userId: user.id, status: "ACTIVE" },
    select: { role: true },
  });
  if (!membership || membership.role !== "OWNER") {
    return { error: "Only the workspace owner can manage billing." };
  }

  const subscription = await prisma.subscription.findUnique({ where: { organizationId }, select: { razorpaySubscriptionId: true } });
  if (!subscription?.razorpaySubscriptionId) {
    return { error: "No active subscription to cancel." };
  }

  try {
    await getRazorpay().subscriptions.cancel(subscription.razorpaySubscriptionId, true);
  } catch (err) {
    return { error: (err as Error).message };
  }

  await syncSubscriptionToControlPlane(organizationId, "Owner requested cancellation");

  revalidatePath("/dashboard/settings");
  return { error: null };
}
