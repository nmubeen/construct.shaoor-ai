import { rawPrisma } from "@/lib/prisma";
import { getTenantContext, tenantPath } from "@/lib/tenant";
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
  const { companyId } = await getTenantContext();
  const user = await rawPrisma.user.findUnique({
    where: {
      companyId_email: {
        companyId,
        email: email.trim().toLowerCase(),
      },
    },
  });

  if (!user) {
    return {
      success: false,
      error: "Invalid user ID or password.",
    };
  }

  const valid = await verifyPassword(
    password,
    user.passwordHash
  );

  if (!valid) {
    return {
      success: false,
      error: "Invalid user ID or password.",
    };
  }

  const company = await rawPrisma.company.findFirst({
    where: { id: companyId, adminUserId: user.id, status: "ACTIVE" },
    select: { id: true },
  });

  if (!company) {
    return { success: false, error: "You are not the administrator for this company." };
  }

  await createSession(user.id, companyId);

  return {
    success: true,
    mustChangePassword: companyId !== 0 && password === "Password",
  };
}

export async function logout() {
  await destroySession();

  redirect(await tenantPath("/login"));
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
    redirect(await tenantPath("/login"));
  }

  return user;
}
