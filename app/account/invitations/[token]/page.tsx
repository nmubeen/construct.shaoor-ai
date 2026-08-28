import { createHash } from "node:crypto";
import Link from "next/link";

import { ConstructAuthShell } from "@/components/auth/ConstructAuthShell";
import { acceptConstructInvitationAction, sendConstructInvitationSignInLinkAction } from "@/lib/actions/construct-invitation.actions";
import { getOptionalConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

export default async function InvitationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { token } = await params; const query = await searchParams; const valid = /^[a-f0-9]{64}$/.test(token);
  const invitation = valid ? await getConstructPrisma().invitation.findUnique({ where: { tokenHash: createHash("sha256").update(token).digest("hex") }, include: { organization: { select: { name: true, status: true } } } }) : null;
  const usable = invitation?.status === "PENDING" && invitation.expiresAt > new Date() && invitation.organization.status === "ACTIVE";
  const context = await getOptionalConstructContext(); const signedInEmail = context?.authUser.email?.toLowerCase(); const matches = usable && signedInEmail === invitation.email;
  return <ConstructAuthShell eyebrow="Workspace invitation" title={usable ? `Join ${invitation.organization.name}` : "Invitation unavailable"} description={usable ? `You have been invited as ${invitation.role.toLowerCase()}.` : "This invitation is invalid, expired, revoked, or already accepted."}>
    {query.error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}{query.sent && <p className="mb-4 rounded-xl bg-teal-50 p-3 text-sm text-teal-800">A secure sign-in link was sent to {invitation?.email}.</p>}
    {usable && (matches ? <form action={acceptConstructInvitationAction}><input type="hidden" name="token" value={token}/><button className="w-full rounded-xl bg-[#0E4A7B] px-4 py-3 font-semibold text-white">Accept invitation</button></form> : context?.authUser ? <div className="space-y-3"><p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">You are signed in as {signedInEmail}. This invitation belongs to {invitation.email}.</p><Link href={`/account/login?next=${encodeURIComponent(`/account/invitations/${token}`)}`} className="block text-center text-sm font-semibold text-teal-700">Sign in with the invited account</Link></div> : <div className="space-y-3"><form action={sendConstructInvitationSignInLinkAction}><input type="hidden" name="token" value={token}/><button className="w-full rounded-xl bg-[#0E4A7B] px-4 py-3 font-semibold text-white">Email me a secure sign-in link</button></form><p className="text-center text-xs text-slate-500">The link will be sent only to {invitation.email}.</p><Link href={`/account/login?next=${encodeURIComponent(`/account/invitations/${token}`)}`} className="block text-center text-sm font-semibold text-teal-700">I already have a password</Link></div>)}
  </ConstructAuthShell>;
}
