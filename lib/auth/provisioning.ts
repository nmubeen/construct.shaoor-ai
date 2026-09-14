// Construct account provisioning for the authenticated user — the on-demand
// replacement for construct.handle_new_user() (the trigger on auth.users
// that used to create an organization/membership/subscription eagerly from
// password-signup metadata; see
// prisma/migrations-construct/20260914000000_otp_auth_cutover for its
// removal). Split into two steps because the OTP flow can't collect an
// organization name/slug up front the way the old password signup form
// did (sign-up and sign-in are the same action):
//
// 1. reconcileConstructUserForCurrentSession() — always safe to call on
//    every sign-in/self-heal. Keeps construct.users in sync and reconciles
//    a pending team invite, but NEVER creates a new organization. Handles
//    a shared identity that first authenticated through another
//    shaoor-ai.com app (active "construct" app_membership, no
//    construct.users row yet) and an invited member's first sign-in.
// 2. createConstructOrganizationForCurrentUser() — the explicit,
//    user-driven creation step. Only called from
//    completeConstructSetupAction (see lib/auth/actions.ts) once the
//    person has actually chosen a name and slug on /account/setup — the
//    workspace slug is permanent (see app/dashboard/settings/page.tsx), so
//    it must never be silently auto-generated.
//
// Written directly in Prisma/TypeScript rather than as a Postgres function
// called via $queryRaw (lib/control-sync.ts's pattern) — that pattern exists
// there because the logic has to run inside the SAME transaction as an
// auth.users INSERT, which application code can't hook into. Once
// provisioning runs on-demand from a Server Action instead, a plain Prisma
// transaction is the more consistent choice: it's how every other piece of
// Construct's own business logic already works (construct-context.ts,
// construct-team.actions.ts, construct-invitation.actions.ts), no new SQL
// function to maintain.
import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";

import { getConstructPrisma } from "@/lib/construct-prisma";
import { syncSubscriptionToControlPlane } from "@/lib/control-sync";
import { logAuthDiagnostic } from "./diagnostics";

const TRIAL_DAYS = 14;

async function upsertConstructUser(authUser: SupabaseUser) {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) throw new Error("The authenticated account does not have an email address.");

  const fullName =
    typeof authUser.user_metadata.full_name === "string"
      ? authUser.user_metadata.full_name.trim() || null
      : null;

  return getConstructPrisma().user.upsert({
    where: { id: authUser.id },
    update: { email, fullName: fullName ?? undefined },
    create: { id: authUser.id, email, fullName },
  });
}

/** Keeps construct.users in sync and reconciles a pending team invite for
 * this email — never creates a new organization. Safe to call on every
 * sign-in and every self-heal (lib/auth/construct-context.ts). Returns
 * whether the user now has an active organization membership; `false`
 * means /account/setup is next. Never throws — a failure here should not
 * block sign-in, just leave the person on /account/setup or /account/pending. */
export async function reconcileConstructUserForCurrentSession(authUser: SupabaseUser): Promise<boolean> {
  const prisma = getConstructPrisma();

  try {
    const user = await upsertConstructUser(authUser);
    const email = user.email;

    const existingMembership = await prisma.membership.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      select: { id: true },
    });
    if (existingMembership) return true;

    // Reconcile a pending invite for this email — mirrors
    // construct.handle_new_user()'s unconditional invite-reconciliation
    // step. Mirrors what acceptConstructInvitationAction() does for the
    // token-link flow, for the plain-email-match one instead.
    const invite = await prisma.membership.findFirst({
      where: { invitedEmail: email, status: "INVITED", userId: null },
    });
    if (invite) {
      await prisma.membership.update({
        where: { id: invite.id },
        data: { userId: user.id, status: "ACTIVE", invitedEmail: null },
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error("Construct account reconciliation failed:", error);
    logAuthDiagnostic("account_provisioning_failed");
    return false;
  }
}

export type CreateOrganizationResult =
  | { ok: true }
  | { ok: false; error: "already-has-organization" | "slug-taken" | "failed" };

/** Explicit, user-driven organization creation — only call this once the
 * person has chosen a name and permanent slug on /account/setup (see
 * completeConstructSetupAction in lib/auth/actions.ts). Re-checks for an
 * existing organization itself (a concurrent tab, a double-submit) rather
 * than trusting the caller, so it can never create a duplicate. */
export async function createConstructOrganizationForCurrentUser(
  authUser: SupabaseUser,
  input: { name: string; slug: string },
): Promise<CreateOrganizationResult> {
  const prisma = getConstructPrisma();

  try {
    const user = await upsertConstructUser(authUser);

    const existingMembership = await prisma.membership.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      select: { id: true },
    });
    if (existingMembership) return { ok: false, error: "already-has-organization" };

    const slugTaken = await prisma.organization.findUnique({ where: { slug: input.slug }, select: { id: true } });
    if (slugTaken) return { ok: false, error: "slug-taken" };

    const organizationId = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          status: "ACTIVE",
          planCode: "TRIAL",
          trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
        },
      });

      await tx.membership.create({
        data: { organizationId: org.id, userId: user.id, role: "OWNER", status: "ACTIVE" },
      });

      await tx.subscription.create({
        data: { organizationId: org.id, status: "TRIALING" },
      });

      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          actorUserId: user.id,
          module: "organization",
          action: "provision",
          recordId: org.id,
          title: "Construct organization provisioned",
          details: { slug: input.slug, accessMode: "trial", trialStartedAt: new Date().toISOString() },
        },
      });

      return org.id;
    });

    // Best-effort control-plane mirror — must never block sign-up.
    await syncSubscriptionToControlPlane(organizationId, "Self-service Construct OTP sign-up");

    return { ok: true };
  } catch (error) {
    // A unique_violation on slug (lost the race against a concurrent
    // signup for the same address) surfaces here too, not just from the
    // findUnique check above.
    console.error("Construct organization creation failed:", error);
    logAuthDiagnostic("account_provisioning_failed");
    return { ok: false, error: "failed" };
  }
}
