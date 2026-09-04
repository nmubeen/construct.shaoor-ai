"use server";

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

// Invites are a Membership row with status INVITED and no userId yet
// (invitedEmail carries the address) — mirrors pets.shaoor-ai.com's
// plain email-reconciliation pattern. construct.handle_new_user() (the
// signup trigger) fills in userId and flips status to ACTIVE the moment
// that email signs up; requireActiveConstructContext()'s user sync does
// the same for an existing account signing in for the first time after
// being invited. No token, no link, no separate email step here — unlike
// the old construct.invitations table this replaces for new invites (that
// table/its accept route stay live only for already-emailed links from
// before this change).
export async function createConstructInvitationAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireManager(context.role);
  const parsed = inviteSchema.safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) redirect(`/dashboard/team?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid invitation.")}`);
  if (context.role === "ADMIN" && parsed.data.role === "ADMIN") redirect("/dashboard/team?error=Only the Owner can invite another Admin.");

  const prisma = getConstructPrisma();
  const memberCount = await prisma.membership.count({ where: { organizationId: context.organizationId, status: { in: ["ACTIVE", "INVITED"] } } });
  try {
    await enforceConstructNumericLimit(context.organizationId, "MAX_TEAM_MEMBERS", memberCount);
  } catch (error) {
    redirect(`/dashboard/team?error=${encodeURIComponent(error instanceof Error ? error.message : "Team member limit reached.")}`);
  }

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existingUser) {
    const membership = await prisma.membership.findUnique({ where: { organizationId_userId: { organizationId: context.organizationId, userId: existingUser.id } } });
    if (membership) redirect("/dashboard/team?error=That person is already a member of this workspace.");
  }

  const existingInvite = await prisma.membership.findFirst({
    where: { organizationId: context.organizationId, invitedEmail: parsed.data.email, status: "INVITED" },
    select: { id: true },
  });

  const saved = await prisma.$transaction(async (tx) => {
    const membership = existingInvite
      ? await tx.membership.update({ where: { id: existingInvite.id }, data: { role: parsed.data.role } })
      : await tx.membership.create({ data: { organizationId: context.organizationId, invitedEmail: parsed.data.email, role: parsed.data.role, status: "INVITED" } });
    await tx.auditLog.create({
      data: {
        organizationId: context.organizationId,
        actorUserId: context.userId,
        module: "team",
        action: existingInvite ? "invite_resend" : "invite",
        recordId: membership.id,
        title: `Invitation created for ${parsed.data.email}`,
        details: { role: parsed.data.role },
      },
    });
    return membership;
  });

  revalidatePath("/dashboard/team");
  redirect(`/dashboard/team?invited=${encodeURIComponent(parsed.data.email)}&role=${saved.role}`);
}

export async function revokeConstructInvitationAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireManager(context.role);
  const id = String(formData.get("id") ?? "");
  const prisma = getConstructPrisma();
  const invite = await prisma.membership.findFirst({ where: { id, organizationId: context.organizationId, status: "INVITED" }, select: { invitedEmail: true, role: true } });
  if (!invite) redirect("/dashboard/team?error=Pending invitation not found.");
  if (context.role === "ADMIN" && invite.role === "ADMIN") redirect("/dashboard/team?error=Only the Owner can revoke an Admin invitation.");
  await prisma.$transaction([
    prisma.membership.delete({ where: { id } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "team", action: "invite_revoke", recordId: id, title: `Invitation revoked for ${invite.invitedEmail}` } }),
  ]);
  revalidatePath("/dashboard/team");
  redirect("/dashboard/team?updated=1");
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
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "team", action: "role_update", recordId: membership.id, title: `Role updated for ${membership.user?.email ?? membership.invitedEmail}`, details: { from: membership.role, to: role } } }),
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
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "team", action: "member_remove", recordId: membership.id, title: `Member removed: ${membership.user?.email ?? membership.invitedEmail}`, details: { role: membership.role } } }),
  ]);
  revalidatePath("/dashboard/team"); redirect("/dashboard/team?updated=1");
}
