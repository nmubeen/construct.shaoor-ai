"use server";

import { redirect } from "next/navigation";

import { login, logout } from "@/lib/auth/auth";

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
      error: "Email and password are required.",
    };
  }

  const result = await login(email, password);

  if (!result.success) {
    return {
      error: result.error,
    };
  }

  redirect("/admin");
}

/**
 * Logout Server Action
 */
export async function logoutAction() {
  await logout();

  redirect("/login");
}