// Idempotent Construct account provisioning for the authenticated user —
// the on-demand replacement for construct.handle_new_user() (the trigger on
// auth.users that used to create an organization/membership/subscription
// eagerly from password-signup metadata; see
// prisma/migrations-construct/20260914000000_drop_signup_trigger for its
// removal). Needed for the OTP flow because sign-up and sign-in are the
// same action (there is no separate step to collect an organization name),
// and because a shared identity that first authenticated through another
// shaoor-ai.com app has an active "construct" app_membership (see
// lib/auth/membership.ts) but no construct.organizations row yet.
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

function randomSlugSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function slugFromEmail(email: string) {
  const base = email.split("@")[0]!.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24) || "workspace";
  return `${base}-${randomSlugSuffix()}`;
}

/** Returns true once the current user is confirmed to have an active
 * Construct organization membership (pre-existing or freshly provisioned by
 * this call), false if provisioning itself failed. Never throws. */
export async function ensureConstructAccountForCurrentUser(authUser: SupabaseUser): Promise<boolean> {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) return false;

  const prisma = getConstructPrisma();

  try {
    // Mirrors what the old trigger did unconditionally on every signup, and
    // what synchronizeConstructUser() already does on every sign-in: keep
    // construct.users in sync with the shared auth identity first, since
    // construct.memberships.user_id FKs to it, not to auth.users directly.
    const fullName =
      typeof authUser.user_metadata.full_name === "string"
        ? authUser.user_metadata.full_name.trim() || null
        : null;
    const user = await prisma.user.upsert({
      where: { id: authUser.id },
      update: { email, fullName: fullName ?? undefined },
      create: { id: authUser.id, email, fullName },
    });

    const existingMembership = await prisma.membership.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      select: { id: true },
    });
    if (existingMembership) return true;

    // Reconcile a pending invite for this email before creating a brand-new
    // organization — mirrors construct.handle_new_user()'s unconditional
    // invite-reconciliation step.
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

    // No organization at all yet: create one. The OTP flow never collects a
    // company name (sign-up and sign-in are the same action), so this
    // starts with a placeholder the owner can rename from
    // /dashboard/settings — same "no separate onboarding step" principle
    // the old trigger followed, just without borrowing a name from a form
    // that no longer exists.
    const organizationId = await prisma.$transaction(async (tx) => {
      let slug = slugFromEmail(email);
      // Slug collisions are rare (random suffix) but not impossible —
      // retry a few times rather than letting a unique_violation blow up
      // an otherwise-successful sign-in.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const clash = await tx.organization.findUnique({ where: { slug }, select: { id: true } });
        if (!clash) break;
        slug = slugFromEmail(email);
      }

      const org = await tx.organization.create({
        data: {
          name: "My Organization",
          slug,
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
          details: { slug, accessMode: "trial", trialStartedAt: new Date().toISOString() },
        },
      });

      return org.id;
    });

    // Best-effort control-plane mirror — must never block sign-in.
    await syncSubscriptionToControlPlane(organizationId, "Self-service Construct OTP sign-up");

    return true;
  } catch (error) {
    console.error("Construct account provisioning failed:", error);
    logAuthDiagnostic("account_provisioning_failed");
    return false;
  }
}
