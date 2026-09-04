import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getConstructPrisma } from "@/lib/construct-prisma";
import { getConstructCommercialAccess } from "@/lib/control/construct-subscription.service";
import { createClient } from "@/lib/supabase/server";

export async function synchronizeConstructUser(authUser: SupabaseUser) {
  const constructPrisma = getConstructPrisma();
  const email = authUser.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("The authenticated account does not have an email address.");
  }

  const fullName =
    typeof authUser.user_metadata.full_name === "string"
      ? authUser.user_metadata.full_name.trim() || null
      : null;

  return constructPrisma.user.upsert({
    where: { id: authUser.id },
    update: { email, fullName },
    create: { id: authUser.id, email, fullName },
  });
}

export async function getOptionalConstructContext(organizationSlug?: string) {
  const constructPrisma = getConstructPrisma();
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await constructPrisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      memberships: {
        where: organizationSlug
          ? { organization: { slug: organizationSlug } }
          : undefined,
        include: { organization: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) {
    return { authUser, user: null, membership: null, organization: null };
  }

  const membership = user.memberships.find(
    ({ organization }) => organization.status === "ACTIVE",
  ) ?? null;

  return {
    authUser,
    user,
    membership,
    organization: membership?.organization ?? null,
  };
}

export async function requireActiveConstructContext(organizationSlug?: string) {
  const context = await getOptionalConstructContext(organizationSlug);

  if (!context) redirect("/account/login");
  if (!context.user || !context.membership || !context.organization) {
    // Signup always provisions a membership via the DB trigger now — this
    // means something didn't complete (or this is a pre-existing account
    // from before this change). /account/signup is the honest way back in
    // rather than a now-deleted onboarding step.
    redirect("/account/signup");
  }
  if (context.organization.status !== "ACTIVE") {
    redirect("/account/pending");
  }
  const commercial=await getConstructCommercialAccess(context.organization.id);
  if(commercial&&!commercial.accessAllowed) redirect("/account/pending?reason=subscription");

  return {
    authUser: context.authUser,
    user: context.user,
    membership: context.membership,
    organization: context.organization,
    organizationId: context.organization.id,
    userId: context.user.id,
    role: context.membership.role,
  };
}
