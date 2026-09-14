"use server";

// Mirrors TuiTrak's lib/auth/actions.ts submitAuth() pattern: OTP
// request/verify, membership registration, and account provisioning all
// happen server-side, on the SAME auth client, within one action
// invocation — no browser-side verifyOtp()/register_app_membership call,
// no reliance on onAuthStateChange()/getSession()/getUser() to learn
// whether the session is "ready" for a follow-up request. The browser only
// performs a full navigation once this has already completed (including
// cookie writes) — see components/auth/EmailOtpForm.tsx.
import { redirect } from "next/navigation";

import { appUrl } from "@/lib/construct-app-url";
import { createClient } from "@/lib/supabase/server";
import { isSafeConstructRedirect } from "./construct-redirect";
import { registerAppMembership, membershipError } from "./membership";
import { createConstructOrganizationForCurrentUser, reconcileConstructUserForCurrentSession } from "./provisioning";

const ORGANIZATION_SLUG_PATTERN = /^[a-z0-9]{2,32}$/;

export type AuthMode = "email-code" | "verify-code";
export type AuthResult = { error?: string; codeSent?: boolean; redirect?: string };

// Supabase's own default OTP length — Construct has no per-environment
// override (unlike TuiTrak's NEXT_PUBLIC_SUPABASE_OTP_LENGTH), so this
// stays a fixed constant rather than adding env-var plumbing nothing else
// in this app needs yet.
const OTP_LENGTH = 6;

function validEmail(value: string) {
  return value.length > 0 && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function otpErrorMessage(error: { message: string }, verifying: boolean) {
  if (/rate limit/i.test(error.message)) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (verifying) {
    return /expired|invalid|token/i.test(error.message)
      ? "That code is invalid or has expired. Request a new one."
      : "We could not verify that code. Please try again.";
  }
  return "We could not send a code to that address. Please try again.";
}

export async function submitAuth(mode: AuthMode, form: FormData): Promise<AuthResult> {
  if (mode !== "email-code" && mode !== "verify-code") return { error: "Invalid request." };
  const field = (name: string) => (typeof form.get(name) === "string" ? String(form.get(name)) : "");
  const email = field("email").trim().toLowerCase();
  const token = field("token").trim();
  const requestedNext = field("next");

  if (!validEmail(email)) return { error: "Please enter a valid email address." };
  if (mode === "verify-code" && !new RegExp(`^[0-9]{${OTP_LENGTH}}$`).test(token)) {
    return { error: `Enter the ${OTP_LENGTH}-digit code from your email.` };
  }

  const client = await createClient();

  if (mode === "email-code") {
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // The shared Send Email Hook picks this app's sender/branding from
        // this hostname — required even though this flow never follows the
        // link, since the code is entered manually below.
        emailRedirectTo: `${appUrl()}/account/login`,
      },
    });
    if (error) return { error: otpErrorMessage(error, false) };
    return { codeSent: true };
  }

  // verify-code
  const { data, error } = await client.auth.verifyOtp({ email, token, type: "email" });
  if (error || !data.session || !data.user) {
    return { error: otpErrorMessage(error ?? { message: "Verification did not return a session" }, true) };
  }

  // Gate B: register/confirm an active "construct" app membership, on the
  // SAME client/request that just established the session.
  let membership;
  try {
    membership = await registerAppMembership(client);
  } catch {
    return { redirect: `/account/error?reason=${membershipError(null, "rpc-failed")}` };
  }
  if (membership?.status !== "active") {
    return { redirect: `/account/error?reason=${membershipError(membership, "missing")}` };
  }

  // Gate C: reconcile the local user + any pending team invite. This never
  // creates a new organization — the workspace slug is permanent (see
  // app/dashboard/settings/page.tsx), so it must be chosen by the person,
  // not auto-generated. A brand-new signup with no invite to reconcile into
  // lands on /account/setup instead of /dashboard.
  const hasOrganization = await reconcileConstructUserForCurrentSession(data.user);

  // A team invitation's "sign in with a different account" link round-trips
  // here via a hidden `next` field so the user lands back on that
  // invitation's accept screen instead of /dashboard.
  if (isSafeConstructRedirect(requestedNext)) return { redirect: requestedNext };

  return { redirect: hasOrganization ? "/dashboard" : "/account/setup" };
}

export async function constructSignOutAction() {
  const client = await createClient();
  await client.auth.signOut();
  redirect("/account/login");
}

/** Completes a brand-new signup that reconcileConstructUserForCurrentSession()
 * left without an organization — the one place a Construct workspace name
 * and permanent slug are ever chosen. See app/account/setup/page.tsx. Uses
 * redirect() directly (not a returned result) — invoked from a plain
 * <form action={...}>, same convention as the old password actions, unlike
 * submitAuth() above (called as a function from client-side JS). */
export async function completeConstructSetupAction(formData: FormData) {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/account/login");

  const field = (name: string) => (typeof formData.get(name) === "string" ? String(formData.get(name)) : "");
  const name = field("name").trim();
  const slug = field("slug").trim().toLowerCase();

  if (name.length < 2 || name.length > 100) {
    redirect(`/account/setup?error=${encodeURIComponent("Enter your company name.")}`);
  }
  if (!ORGANIZATION_SLUG_PATTERN.test(slug)) {
    redirect(`/account/setup?error=${encodeURIComponent("Workspace address must be 2-32 lowercase letters or numbers.")}`);
  }

  const result = await createConstructOrganizationForCurrentUser(user, { name, slug });
  if (result.ok || result.error === "already-has-organization") redirect("/dashboard");
  if (result.error === "slug-taken") {
    redirect(`/account/setup?error=${encodeURIComponent("That workspace address is already taken. Try another.")}`);
  }
  redirect(`/account/setup?error=${encodeURIComponent("We couldn't create your workspace. Please try again.")}`);
}
