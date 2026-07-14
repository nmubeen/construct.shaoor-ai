import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { verifyPassword } from "./password";
import {
  createSession,
  destroySession,
  getCurrentUser,
} from "./session";

export async function login(
  email: string,
  password: string
) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
  });

  if (!user) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  const valid = await verifyPassword(
    password,
    user.passwordHash
  );

  if (!valid) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  await createSession(user.id);

  return {
    success: true,
  };
}

export async function logout() {
  await destroySession();

  redirect("/login");
}

/**
 * Returns the currently authenticated user.
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