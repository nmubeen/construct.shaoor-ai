import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getConstructPrisma } from "@/lib/construct-prisma";
import { getConstructCommercialAccess } from "@/lib/control/construct-subscription.service";
import { createClient } from "@/lib/supabase/server";
import { ensureAppMembership, membershipError } from "@/lib/auth/membership";
import { reconcileConstructUserForCurrentSession } from "@/lib/auth/provisioning";
import { logAuthDiagnostic } from "@/lib/auth/diagnostics";

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

  // Gate: shared cross-app identity gate (public.app_memberships, keyed
  // "construct") — fails closed on a missing row, an inactive/suspended
  // status, or an RPC failure. Self-heals a session that reached here
  // without ever completing lib/auth/actions.ts's registration step (a
  // race right after verifyOtp, a session that predates this feature, or
  // one established via the team invitation email-link flow, which never
  // calls submitAuth() at all — see lib/actions/construct-invitation.actions.ts).
  // Deliberately independent of Construct's own organization/subscription
  // gate below: a suspended app membership is an ops-level identity ban,
  // not a billing state.
  let appMembershipError: string | null = null;
  try {
    const appMembership = await ensureAppMembership(supabase);
    if (appMembership?.status !== "active") {
      appMembershipError = membershipError(appMembership, "missing");
    }
  } catch {
    appMembershipError = membershipError(null, "rpc-failed");
  }
  if (appMembershipError) {
    return { authUser, user: null, membership: null, organization: null, appMembershipError };
  }

  let user = await constructPrisma.user.findUnique({
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
    // Self-heal: an active app membership but no local construct.users row
    // yet — e.g. the first Construct visit after authenticating through
    // another shaoor-ai.com app, or a race right after verifyOtp. Only
    // reconciles (upserts the user row, joins a pending invite) — never
    // creates a new organization; requireActiveConstructContext() below
    // sends a brand-new signup to /account/setup to choose one instead.
    logAuthDiagnostic("account_missing");
    await reconcileConstructUserForCurrentSession(authUser);
    user = await constructPrisma.user.findUnique({
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
  }

  if (!user) {
    return { authUser, user: null, membership: null, organization: null, appMembershipError: null };
  }

  const membership = user.memberships.find(
    ({ organization }) => organization.status === "ACTIVE",
  ) ?? null;

  return {
    authUser,
    user,
    membership,
    organization: membership?.organization ?? null,
    appMembershipError: null,
  };
}

export async function requireActiveConstructContext(organizationSlug?: string) {
  const context = await getOptionalConstructContext(organizationSlug);

  if (!context) redirect("/account/login");
  if (context.appMembershipError) redirect(`/account/error?reason=${context.appMembershipError}`);
  if (!context.user || !context.membership || !context.organization) {
    // A brand-new signup (or a shared identity's first Construct visit)
    // reconciles fine above but never auto-creates an organization — the
    // workspace slug is permanent, so it's chosen on /account/setup, not
    // silently generated. lib/auth/actions.ts's submitAuth() already sends
    // people there right after verifyOtp; this covers anyone who instead
    // lands on a protected route directly (a bookmark, a shared link).
    redirect("/account/setup");
  }
  if (context.organization.status !== "ACTIVE") {
    redirect("/account/pending");
  }
  const commercial = await getConstructCommercialAccess(context.organization.id);
  if (commercial && !commercial.accessAllowed) redirect("/account/pending?reason=subscription");

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
