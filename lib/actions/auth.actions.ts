"use server";

import { redirect } from "next/navigation";

import { login, logout } from "@/lib/auth/auth";
import { tenantPath } from "@/lib/tenant";

/**
 * Login Server Action
 */
export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "User ID and password are required.",
    };
  }

  const result = await login(email, password);

  if (!result.success) {
    return {
      error: result.error,
    };
  }

  if (result.mustChangePassword) {
    redirect(await tenantPath("/change-password"));
  }

  redirect(await tenantPath("/admin"));
}

/**
 * Logout Server Action
 */
export async function logoutAction() {
  await logout();

  redirect(await tenantPath("/login"));
}
