import Link from "next/link";

import { ConstructAuthShell } from "@/components/auth/ConstructAuthShell";
import { ConstructPasswordInput } from "@/components/auth/ConstructPasswordInput";
import { constructSignInAction } from "@/lib/actions/construct-auth.actions";

export default async function ConstructLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string; email?: string }>;
}) {
  const { error, message, next, email } = await searchParams;

  return (
    <ConstructAuthShell
      eyebrow="Customer account"
      title="Welcome back"
      description="Sign in to manage your construction company website."
    >
      <form action={constructSignInAction} className="space-y-5">
        {next && <input type="hidden" name="next" value={next} />}
        {message && (
          <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-800">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
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
            defaultValue={email}
            className="mt-2 w-full rounded-md border border-[#7D9D76] px-4 py-3 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <ConstructPasswordInput
            name="password"
            autoComplete="current-password"
            required
            className="mt-2 w-full rounded-md border border-[#7D9D76] px-4 py-3 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <button className="w-full rounded-md bg-[#094136] px-4 py-3 font-semibold text-white transition hover:bg-[#7D9D76]">
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
