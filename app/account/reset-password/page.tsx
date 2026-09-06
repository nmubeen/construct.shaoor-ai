import { ConstructAuthShell } from "@/components/auth/ConstructAuthShell";
import { ConstructPasswordInput } from "@/components/auth/ConstructPasswordInput";
import { updateConstructPasswordAction } from "@/lib/actions/construct-auth.actions";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <ConstructAuthShell eyebrow="Account recovery" title="Choose a new password" description="Use at least 8 characters with uppercase, lowercase, a number and a special character.">
      <form action={updateConstructPasswordAction} className="space-y-5">
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-semibold text-slate-700">New password<ConstructPasswordInput name="password" autoComplete="new-password" minLength={8} required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100" /></label>
        <label className="block text-sm font-semibold text-slate-700">Confirm password<ConstructPasswordInput name="confirmation" autoComplete="new-password" minLength={8} required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100" /></label>
        <button className="w-full rounded-xl bg-[#0E4A7B] px-4 py-3 font-semibold text-white hover:bg-[#0A365A]">Update password</button>
      </form>
    </ConstructAuthShell>
  );
}
