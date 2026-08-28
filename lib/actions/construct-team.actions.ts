"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { enforceConstructNumericLimit } from "@/lib/control/construct-subscription.service";

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

function requireManager(role: string) {
  if (role !== "OWNER" && role !== "ADMIN") redirect("/dashboard/team?error=Only Owners and Admins can manage the team.");
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function createConstructInvitationAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireManager(context.role);
  const parsed = inviteSchema.safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) redirect(`/dashboard/team?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid invitation.")}`);
  if (context.role === "ADMIN" && parsed.data.role === "ADMIN") redirect("/dashboard/team?error=Only the Owner can invite another Admin.");

  const prisma = getConstructPrisma();
  const [memberCount,pendingCount]=await Promise.all([prisma.membership.count({where:{organizationId:context.organizationId}}),prisma.invitation.count({where:{organizationId:context.organizationId,status:"PENDING",expiresAt:{gt:new Date()}}})]);
  try{await enforceConstructNumericLimit(context.organizationId,"MAX_TEAM_MEMBERS",memberCount+pendingCount);}catch(error){redirect(`/dashboard/team?error=${encodeURIComponent(error instanceof Error?error.message:"Team member limit reached.")}`);}
  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existingUser) {
    const membership = await prisma.membership.findUnique({ where: { organizationId_userId: { organizationId: context.organizationId, userId: existingUser.id } } });
    if (membership) redirect("/dashboard/team?error=That person is already a member of this workspace.");
  }

  const token = randomBytes(32).toString("hex");
  const hash = tokenHash(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const existingInvite = await prisma.invitation.findFirst({ where: { organizationId: context.organizationId, email: parsed.data.email, status: "PENDING" }, select: { id: true } });

  const invitation = await prisma.$transaction(async (tx) => {
    const saved = existingInvite
      ? await tx.invitation.update({ where: { id: existingInvite.id }, data: { role: parsed.data.role, tokenHash: hash, expiresAt, invitedById: context.userId } })
      : await tx.invitation.create({ data: { organizationId: context.organizationId, email: parsed.data.email, role: parsed.data.role, tokenHash: hash, expiresAt, invitedById: context.userId } });
    await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "team", action: existingInvite ? "invite_resend" : "invite", recordId: saved.id, title: `Invitation created for ${parsed.data.email}`, details: { role: parsed.data.role, expiresAt: expiresAt.toISOString() } } });
    return saved;
  });

  revalidatePath("/dashboard/team");
  const inviteUrl = `${appUrl()}/account/invitations/${token}`;
  redirect(`/dashboard/team?invitation=${invitation.id}&link=${encodeURIComponent(inviteUrl)}`);
}

export async function revokeConstructInvitationAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireManager(context.role);
  const id = String(formData.get("id") ?? ""); const prisma = getConstructPrisma();
  const invitation = await prisma.invitation.findFirst({ where: { id, organizationId: context.organizationId, status: "PENDING" }, select: { email: true, role: true } });
  if (!invitation) redirect("/dashboard/team?error=Pending invitation not found.");
  if (context.role === "ADMIN" && invitation.role === "ADMIN") redirect("/dashboard/team?error=Only the Owner can revoke an Admin invitation.");
  await prisma.$transaction([
    prisma.invitation.update({ where: { id }, data: { status: "REVOKED" } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "team", action: "invite_revoke", recordId: id, title: `Invitation revoked for ${invitation.email}` } }),
  ]);
  revalidatePath("/dashboard/team"); redirect("/dashboard/team?updated=1");
}

export async function updateConstructMemberRoleAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireManager(context.role);
  const membershipId = String(formData.get("membershipId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (role !== "ADMIN" && role !== "EDITOR" && role !== "VIEWER") redirect("/dashboard/team?error=Invalid role.");
  const prisma = getConstructPrisma();
  const membership = await prisma.membership.findFirst({ where: { id: membershipId, organizationId: context.organizationId }, include: { user: { select: { email: true } } } });
  if (!membership) redirect("/dashboard/team?error=Member not found.");
  if (membership.role === "OWNER") redirect("/dashboard/team?error=The Owner role cannot be changed here.");
  if (context.role === "ADMIN" && (membership.role === "ADMIN" || role === "ADMIN")) redirect("/dashboard/team?error=Only the Owner can manage Admin roles.");
  await prisma.$transaction([
    prisma.membership.update({ where: { id: membership.id }, data: { role } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "team", action: "role_update", recordId: membership.id, title: `Role updated for ${membership.user.email}`, details: { from: membership.role, to: role } } }),
  ]);
  revalidatePath("/dashboard/team"); redirect("/dashboard/team?updated=1");
}

export async function removeConstructMemberAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireManager(context.role);
  const membershipId = String(formData.get("membershipId") ?? ""); const prisma = getConstructPrisma();
  const membership = await prisma.membership.findFirst({ where: { id: membershipId, organizationId: context.organizationId }, include: { user: { select: { email: true } } } });
  if (!membership) redirect("/dashboard/team?error=Member not found.");
  if (membership.role === "OWNER") redirect("/dashboard/team?error=The workspace Owner cannot be removed.");
  if (membership.userId === context.userId) redirect("/dashboard/team?error=You cannot remove your own membership.");
  if (context.role === "ADMIN" && membership.role === "ADMIN") redirect("/dashboard/team?error=Only the Owner can remove another Admin.");
  await prisma.$transaction([
    prisma.membership.delete({ where: { id: membership.id } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "team", action: "member_remove", recordId: membership.id, title: `Member removed: ${membership.user.email}`, details: { role: membership.role } } }),
  ]);
  revalidatePath("/dashboard/team"); redirect("/dashboard/team?updated=1");
}
