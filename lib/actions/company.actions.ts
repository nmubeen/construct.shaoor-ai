"use server";

import { revalidatePath } from "next/cache";
import { rawPrisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth/auth";
import { hashPassword } from "@/lib/auth/password";
import { getTenantContext } from "@/lib/tenant";
import { randomInt } from "crypto";

async function requireSuperAdmin() {
  const [tenant, user] = await Promise.all([getTenantContext(), currentUser()]);
  if (!tenant.isSuperAdmin || !user) throw new Error("Unauthorized");
}

function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function createCompanyAction(formData: FormData) {
  await requireSuperAdmin();
  const code = String(formData.get("code") ?? "").trim();
  const name = "Administrator";
  const email = `admin@${code}`.toLowerCase();
  const password = "Password";
  const reservedCodes = new Set(["admin", "login", "change-password", "api", "_next", "uploads", "images"]);

  if (!/^[A-Za-z0-9-]+$/.test(code) || reservedCodes.has(code.toLowerCase())) {
    throw new Error("Enter a valid company code containing only letters, numbers, or hyphens.");
  }

  await rawPrisma.$transaction(async (tx) => {
    const company = await tx.company.create({ data: { code } });
    const otp = generateOtp();
    await tx.$executeRaw`UPDATE "Company" SET "otp" = ${otp} WHERE "id" = ${company.id}`;
    const admin = await tx.user.create({
      data: { name, email, passwordHash: await hashPassword(password), companyId: company.id },
    });
    await tx.company.update({ where: { id: company.id }, data: { adminUserId: admin.id } });
  });

  revalidatePath("/admin/companies");
}

export async function setCompanyStatusAction(formData: FormData) {
  await requireSuperAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  if (!Number.isSafeInteger(id) || id === 0) throw new Error("Invalid company.");
  await rawPrisma.company.update({ where: { id }, data: { status } });
  revalidatePath("/admin/companies");
}

export async function updateCompanyAction(formData: FormData) {
  await requireSuperAdmin();
  const companyId = Number(formData.get("id"));
  const code = String(formData.get("code") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const reservedCodes = new Set(["admin", "login", "change-password", "api", "_next", "uploads", "images"]);

  if (!Number.isSafeInteger(companyId) || !/^[A-Za-z0-9-]+$/.test(code) || reservedCodes.has(code.toLowerCase()) || !email || /\s/.test(email)) {
    throw new Error("Enter a valid company code and administrator ID.");
  }

  const [company, companyCodes] = await Promise.all([
    rawPrisma.company.findUnique({ where: { id: companyId }, select: { adminUserId: true } }),
    rawPrisma.company.findMany({ where: { id: { not: companyId } }, select: { code: true } }),
  ]);

  if (!company?.adminUserId) throw new Error("This company does not have an administrator.");
  if (companyCodes.some((item) => item.code.toLowerCase() === code.toLowerCase())) {
    throw new Error("That company code is already in use.");
  }

  await rawPrisma.$transaction([
    rawPrisma.company.update({ where: { id: companyId }, data: { code } }),
    rawPrisma.user.update({ where: { id: company.adminUserId! }, data: { email } }),
  ]);

  revalidatePath("/admin/companies");
}

export type PasswordResetState = { otp?: string };

export async function resetCompanyAdminPasswordAction(
  _previousState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  await requireSuperAdmin();
  const companyId = Number(formData.get("id"));
  if (!Number.isSafeInteger(companyId)) throw new Error("Invalid company.");

  const company = await rawPrisma.company.findUnique({
    where: { id: companyId },
    select: { adminUserId: true },
  });

  if (!company?.adminUserId) throw new Error("This company does not have an administrator.");

  const adminUserId = company.adminUserId;
  const otp = generateOtp();
  await rawPrisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: adminUserId },
      data: { passwordHash: await hashPassword("Password") },
    });
    await tx.$executeRaw`UPDATE "Company" SET "otp" = ${otp}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${companyId}`;
  });

  revalidatePath("/admin/companies");
  return { otp };
}
