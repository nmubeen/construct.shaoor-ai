import Link from "next/link";

import { ConstructAuthShell } from "@/components/auth/ConstructAuthShell";
import { constructSignInAction } from "@/lib/actions/construct-auth.actions";

export default async function ConstructLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;

  return (
    <ConstructAuthShell
      eyebrow="Customer account"
      title="Welcome back"
      description="Sign in to manage your construction company website."
    >
      <form action={constructSignInAction} className="space-y-5">
        {next && <input type="hidden" name="next" value={next} />}
        {message && (
          <p className="rounded-xl bg-teal-50 p-3 text-sm text-teal-800">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <button className="w-full rounded-xl bg-[#0E4A7B] px-4 py-3 font-semibold text-white transition hover:bg-[#0A365A]">
          Sign in
        </button>
        <p className="text-center text-sm text-slate-600">
          <Link
            className="font-semibold text-teal-700 hover:underline"
            href="/account/forgot-password"
          >
            Forgot your password?
          </Link>
        </p>
        <p className="text-center text-sm text-slate-600">
          New to Construct?{" "}
          <Link
            className="font-semibold text-teal-700 hover:underline"
            href="/account/signup"
          >
            Start a trial
          </Link>
        </p>
      </form>
    </ConstructAuthShell>
  );
}
