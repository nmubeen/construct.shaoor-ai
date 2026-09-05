"use server";

import { redirect } from "next/navigation";

import { validateNewPassword } from "@/lib/auth/password-policy";
import {
  getOptionalConstructContext,
  synchronizeConstructUser,
} from "@/lib/auth/construct-context";
import { isSafeConstructRedirect } from "@/lib/auth/construct-redirect";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/construct-app-url";
import { getConstructPrisma } from "@/lib/construct-prisma";

const ORGANIZATION_SLUG_PATTERN = /^[a-z0-9]{2,32}$/;

export async function constructSignUpAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const validationError = validateNewPassword(password, confirmation);
  // Set when this signup came from an invite link (a hidden field on
  // /account/signup's invited-mode form) — an invited person is joining
  // an *existing* organization, so no org name/slug should be collected
  // or sent as signUp() metadata at all. Same bug class as Pets' own
  // 2026-09-04 fix: construct.handle_new_user() already reconciles a
  // pending invite unconditionally (regardless of whether org metadata is
  // present), but the signup form used to force org fields on everyone,
  // so an invited-but-new person had no way to just join — they'd either
  // hit a dead end or accidentally create a second, unrelated org.
  const invited = String(formData.get("invited") ?? "") === "1";
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const organizationSlug = String(formData.get("organizationSlug") ?? "").trim().toLowerCase();

  const invitedQuery = invited ? `&invited=1&email=${encodeURIComponent(email)}` : "";

  if (fullName.length < 2 || fullName.length > 100) {
    redirect(`/account/signup?error=Enter your full name.${invitedQuery}`);
  }
  if (!email) redirect(`/account/signup?error=Enter a valid email address.${invitedQuery}`);
  if (validationError) {
    redirect(`/account/signup?error=${encodeURIComponent(validationError)}${invitedQuery}`);
  }
  if (!invited) {
    if (organizationName.length < 2 || organizationName.length > 100) {
      redirect("/account/signup?error=Enter your company name.");
    }
    if (!ORGANIZATION_SLUG_PATTERN.test(organizationSlug)) {
      redirect(
        "/account/signup?error=Workspace address must be 2-32 lowercase letters or numbers.",
      );
    }
  }

  // This Supabase project's auth.users table is shared across Pets/Chat/
  // Construct, and deliberately allows the same email to sign up again as
  // a brand-new, distinct auth identity (so one person can hold separate
  // accounts per product). construct.users.email is unique, though — one
  // Construct account per email — so a second Construct signup with an
  // email that already has one must be stopped here, before signUp() ever
  // runs. Relying on signUp() itself to reject the duplicate (as the
  // invited-mode branch below still does, for whatever error message
  // Supabase happens to return) is NOT sufficient: signUp() succeeds and
  // hands back a real session for the new duplicate identity, and neither
  // the DB trigger (its ON CONFLICT only covers the id column) nor
  // synchronizeConstructUser() below can reconcile the resulting email
  // clash — confirmed live, it throws an uncaught P2002 and the signup
  // ends on Next's generic error page instead of a readable message.
  const existingConstructUser = await getConstructPrisma().user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingConstructUser) {
    redirect(
      invited
        ? `/account/login?email=${encodeURIComponent(email)}`
        : `/account/signup?error=${encodeURIComponent("An account with this email already exists. Sign in instead.")}`,
    );
  }

  // The org name/slug ride along as auth.signUp() metadata — a database
  // trigger (construct.handle_new_user(), fired on auth.users insert)
  // creates the organization, owner membership and trial subscription
  // immediately, before this request even completes. Mirrors Pets' own
  // signup flow exactly (menagerie.handle_new_user() does the same from
  // workspace_name metadata) — no separate onboarding step needed. In
  // invited mode, no org metadata is sent at all, so only that trigger's
  // unconditional invite-reconciliation step fires.
  const callbackUrl = new URL("/auth/callback", appUrl());
  callbackUrl.searchParams.set("next", "/dashboard");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: invited
        ? { full_name: fullName }
        : {
            full_name: fullName,
            construct_organization_name: organizationName,
            construct_organization_slug: organizationSlug,
          },
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    // An invited person who already has a Construct account elsewhere
    // hits this — send them to sign in instead of a dead-end error.
    if (invited && /already|registered|exists/i.test(error.message)) {
      redirect(`/account/login?email=${encodeURIComponent(email)}`);
    }
    redirect(
      `/account/signup?error=${encodeURIComponent("We could not create this account. It may already exist.")}${invitedQuery}`,
    );
  }
  if (data.session && data.user) {
    await synchronizeConstructUser(data.user);
    redirect("/dashboard");
  }

  redirect(
    invited
      ? "/account/login?message=Check your email to confirm your account, then sign in to start using this workspace."
      : "/account/login?message=Check your email to confirm your account — your trial workspace is already set up and waiting.",
  );
}

export async function constructSignInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "");

  if (!email || !password) {
    redirect("/account/login?error=Email and password are required.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/account/login?error=Invalid email or password.");
  }

  await synchronizeConstructUser(data.user);
  if (
    isSafeConstructRedirect(requestedNext) &&
    requestedNext.startsWith("/account/invitations/")
  ) {
    redirect(requestedNext);
  }
  const context = await getOptionalConstructContext();

  // No membership at all here is unexpected now that signup always
  // provisions one via the DB trigger — /account/pending explains the
  // state and offers a way out rather than a dead onboarding link.
  if (!context?.membership) redirect("/account/pending");
  if (context.organization?.status !== "ACTIVE") redirect("/account/pending");
  redirect("/dashboard");
}

export async function constructSignOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/account/login");
}

export async function requestConstructPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (email) {
    const callbackUrl = new URL("/auth/callback", appUrl());
    callbackUrl.searchParams.set("next", "/account/reset-password");

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl.toString(),
    });

    if (error) {
      console.error("Construct password reset request failed:", error.message);
    }
  }

  // The response is deliberately identical whether or not the address exists.
  redirect("/account/forgot-password?sent=1");
}

export async function updateConstructPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const validationError = validateNewPassword(password, confirmation);

  if (validationError) {
    redirect(
      `/account/reset-password?error=${encodeURIComponent(validationError)}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/account/forgot-password?error=This reset link is invalid or has expired.",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(
      `/account/reset-password?error=${encodeURIComponent(error.message)}`,
    );
  }

  await supabase.auth.signOut();
  redirect("/account/login?message=Your password has been updated.");
}
