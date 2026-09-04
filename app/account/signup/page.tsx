import Link from "next/link";
import { redirect } from "next/navigation";
import { ConstructAuthShell } from "@/components/auth/ConstructAuthShell";
import { constructSignUpAction } from "@/lib/actions/construct-auth.actions";
import { getOptionalConstructContext } from "@/lib/auth/construct-context";

export default async function ConstructSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const context = await getOptionalConstructContext();
  if (context?.membership) redirect("/dashboard");
  const { error } = await searchParams;
  return (
    <ConstructAuthShell
      eyebrow="Free trial"
      title="Create your account"
      description="Your trial workspace is created immediately — no separate setup step."
    >
      <form action={constructSignUpAction} className="space-y-5">
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <label className="block text-sm font-semibold text-slate-700">
          Full name
          <input
            name="fullName"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
          <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">
            At least 12 characters with uppercase, lowercase, a number and a
            special character.
          </span>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Confirm password
          <input
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Company name
          <input
            name="organizationName"
            required
            minLength={2}
            maxLength={100}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Workspace address
          <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-300 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100">
            <input
              name="organizationSlug"
              required
              minLength={2}
              maxLength={32}
              pattern="[a-z0-9]+"
              placeholder="acme"
              className="min-w-0 flex-1 px-4 py-3 lowercase outline-none"
            />
            <span className="flex items-center bg-slate-100 px-3 text-xs text-slate-500">
              .construct.shaoor-ai.com
            </span>
          </div>
          <span className="mt-2 block text-xs font-normal text-slate-500">
            One word using lowercase letters or numbers. This address must be
            unique.
          </span>
        </label>
        <button className="w-full rounded-xl bg-[#0E4A7B] px-4 py-3 font-semibold text-white hover:bg-[#0A365A]">
          Start trial workspace
        </button>
        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/account/login"
            className="font-semibold text-teal-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </ConstructAuthShell>
  );
}
