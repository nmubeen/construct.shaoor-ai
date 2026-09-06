import Link from "next/link";

import { ConstructAuthShell } from "@/components/auth/ConstructAuthShell";
import { requestConstructPasswordResetAction } from "@/lib/actions/construct-auth.actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  return (
    <ConstructAuthShell eyebrow="Account recovery" title="Reset your password" description="Enter your account email. If it exists, we will send a secure reset link.">
      {sent ? (
        <div className="space-y-5"><p className="rounded-md bg-[#eef3ec] p-4 text-sm text-[#7D9D76]">If an account exists for that address, a reset link has been sent.</p><Link className="block text-center font-semibold text-[#7D9D76] hover:underline" href="/account/login">Return to sign in</Link></div>
      ) : (
        <form action={requestConstructPasswordResetAction} className="space-y-5">
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <label className="block text-sm font-semibold text-slate-700">Email<input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-md border border-[#7D9D76] px-4 py-3 outline-none focus:border-[#7D9D76] focus:ring-4 focus:ring-[#7D9D76]/25" /></label>
          <button className="w-full rounded-md bg-[#094136] px-4 py-3 font-semibold text-white hover:bg-[#7D9D76]">Send reset link</button>
        </form>
      )}
    </ConstructAuthShell>
  );
}
