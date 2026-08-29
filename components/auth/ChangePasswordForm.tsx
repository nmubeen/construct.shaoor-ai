"use client";

import { useActionState } from "react";
import { changeDefaultPasswordAction } from "@/lib/actions/password.actions";

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeDefaultPasswordAction, {});

  return (
    <form action={action} className="space-y-5">
      <label className="block text-sm font-medium">New password<input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3" /></label>
      <label className="block text-sm font-medium">Confirm new password<input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3" /></label>
      <label className="block text-sm font-medium">Six-digit OTP<input name="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 font-mono tracking-[0.35em]" /></label>
      {state.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}
      <button disabled={pending} className="w-full rounded-lg bg-[#0E4A7B] py-3 font-medium text-white disabled:opacity-50">{pending ? "Updating…" : "Update Password"}</button>
    </form>
  );
}
