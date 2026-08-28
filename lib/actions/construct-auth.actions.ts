"use server";

import { redirect } from "next/navigation";

import { validateNewPassword } from "@/lib/auth/password-policy";
import {
  getOptionalConstructContext,
  synchronizeConstructUser,
} from "@/lib/auth/construct-context";
import { isSafeConstructRedirect } from "@/lib/auth/construct-redirect";
import { provisionConstructOrganization } from "@/lib/services/construct-provisioning.service";
import { createClient } from "@/lib/supabase/server";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function constructSignInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "");

  if (!email || !password) {
    redirect("/account/login?error=Email and password are required.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/account/login?error=Invalid email or password.");
  }

  await synchronizeConstructUser(data.user);
  if (isSafeConstructRedirect(requestedNext) && requestedNext.startsWith("/account/invitations/")) {
    redirect(requestedNext);
  }
  const context = await getOptionalConstructContext();

  if (!context?.membership) redirect("/account/onboarding");
  if (context.organization?.status !== "ACTIVE") redirect("/account/pending");
  redirect("/dashboard");
}

export async function constructSignOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/account/login");
}

export async function requestConstructPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

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
    redirect(`/account/reset-password?error=${encodeURIComponent(validationError)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account/forgot-password?error=This reset link is invalid or has expired.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/account/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  redirect("/account/login?message=Your password has been updated.");
}

export async function provisionConstructOrganizationAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/account/login");

  try {
    await provisionConstructOrganization({
      authUser: user,
      organizationName: String(formData.get("organizationName") ?? ""),
      organizationSlug: String(formData.get("organizationSlug") ?? ""),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provisioning failed.";
    redirect(`/account/onboarding?error=${encodeURIComponent(message)}`);
  }

  redirect("/account/pending");
}
