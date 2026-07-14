import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { verifyPassword } from "./password";
import {
  createSession,
  destroySession,
  getCurrentUser,
} from "./session";

/**
 * Attempts to log a user in.
 */
export async function login(
  email: string,
  password: string
) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase().trim(),
    },
  });

  if (!user) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  const validPassword = await verifyPassword(
    password,
    user.passwordHash
  );

  if (!validPassword) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  await createSession(user.id);

  return {
    success: true,
    user,
  };
}

/**
 * Logs out the current user.
 */
export async function logout() {
  await destroySession();

  redirect("/login");
}

/**
 * Returns the current authenticated user.
 */
export async function currentUser() {
  return getCurrentUser();
}

/**
 * Protects server pages.
 */
export async function requireUser() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Require an administrator.
 */
export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/login");
  }

  return user;
}