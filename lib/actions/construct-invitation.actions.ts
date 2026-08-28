"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";

import { synchronizeConstructUser } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { createClient } from "@/lib/supabase/server";

function hash(token: string) { return createHash("sha256").update(token).digest("hex"); }
function invitePath(token: string) { return `/account/invitations/${token}`; }
function validToken(token: string) { return /^[a-f0-9]{64}$/.test(token); }

export async function sendConstructInvitationSignInLinkAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!validToken(token)) redirect("/account/login?error=Invalid invitation link.");
  const prisma = getConstructPrisma();
  const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hash(token) }, include: { organization: { select: { status: true } } } });
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date() || invitation.organization.status !== "ACTIVE") redirect(`${invitePath(token)}?error=This invitation is invalid or has expired.`);
  const callback = new URL("/auth/callback", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  callback.searchParams.set("next", invitePath(token));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email: invitation.email, options: { emailRedirectTo: callback.toString(), shouldCreateUser: true } });
  if (error) redirect(`${invitePath(token)}?error=${encodeURIComponent(error.message)}`);
  redirect(`${invitePath(token)}?sent=1`);
}

export async function acceptConstructInvitationAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!validToken(token)) redirect("/account/login?error=Invalid invitation link.");
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect(`/account/login?next=${encodeURIComponent(invitePath(token))}`);
  const email = authUser.email?.trim().toLowerCase();
  const prisma = getConstructPrisma();
  const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hash(token) }, include: { organization: { select: { status: true } } } });
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date() || invitation.organization.status !== "ACTIVE") redirect(`${invitePath(token)}?error=This invitation is invalid or has expired.`);
  if (!email || email !== invitation.email) redirect(`${invitePath(token)}?error=Sign in with ${encodeURIComponent(invitation.email)} to accept this invitation.`);
  const user = await synchronizeConstructUser(authUser);
  await prisma.$transaction(async (tx) => {
    const existing = await tx.membership.findUnique({ where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } } });
    if (!existing) await tx.membership.create({ data: { organizationId: invitation.organizationId, userId: user.id, role: invitation.role } });
    await tx.invitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
    await tx.auditLog.create({ data: { organizationId: invitation.organizationId, actorUserId: user.id, module: "team", action: "invite_accept", recordId: invitation.id, title: `Invitation accepted by ${email}`, details: { role: existing?.role ?? invitation.role } } });
  });
  redirect("/dashboard?joined=1");
}
