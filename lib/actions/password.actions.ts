"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/auth";
import { hashPassword } from "@/lib/auth/password";
import { rawPrisma } from "@/lib/prisma";
import { getTenantContext, tenantPath } from "@/lib/tenant";

export type ChangePasswordState = { error?: string };

export async function changeDefaultPasswordAction(
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const [user, tenant] = await Promise.all([currentUser(), getTenantContext()]);
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const otp = String(formData.get("otp") ?? "").trim();

  if (password.length < 8) return { error: "The new password must contain at least 8 characters." };
  if (password === "Password") return { error: "Choose a password other than the default password." };
  if (password !== confirmPassword) return { error: "The two password entries do not match." };
  if (!/^\d{6}$/.test(otp)) return { error: "Enter the six-digit OTP." };

  const companies = await rawPrisma.$queryRaw<Array<{ id: number }>>`
    SELECT "id"
    FROM "Company"
    WHERE "id" = ${tenant.companyId}
      AND "adminUserId" = ${user.id}
      AND "otp" = ${otp}
    LIMIT 1
  `;

  if (!companies[0]) return { error: "The OTP is incorrect." };

  await rawPrisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
  });

  redirect(await tenantPath("/admin"));
}
