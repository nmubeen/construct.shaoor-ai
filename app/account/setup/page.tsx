import { TriangleAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { ConstructAuthShell } from "@/components/auth/ConstructAuthShell";
import { completeConstructSetupAction } from "@/lib/auth/actions";
import { getOptionalConstructContext } from "@/lib/auth/construct-context";

// The one place a Construct workspace's name and permanent slug are ever
// chosen — the OTP flow unifies sign-up/sign-in (see
// components/auth/EmailOtpForm.tsx), so there's no separate signup form to
// collect these up front the way the old password flow had. Reached right
// after a first-ever verifyOtp with no organization yet (see
// lib/auth/actions.ts's submitAuth()) or by hitting a protected route
// directly before ever completing this step (lib/auth/construct-context.ts).
export default async function ConstructSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const context = await getOptionalConstructContext();
  if (!context) redirect("/account/login");
  if (context.appMembershipError) redirect(`/account/error?reason=${context.appMembershipError}`);
  // Already set up (a second tab, a stale bookmark) — nothing left to do here.
  if (context.membership) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <ConstructAuthShell
      eyebrow="Almost there"
      title="Name your workspace"
      description="Your trial starts as soon as you save — no payment needed."
    >
      <form action={completeConstructSetupAction} className="space-y-5">
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}
        <label className="block text-sm font-semibold text-slate-700">
          Company name
          <input
            name="name"
            autoComplete="organization"
            required
            minLength={2}
            maxLength={100}
            className="mt-2 w-full rounded-md border border-[#7D9D76] px-4 py-3 outline-none focus:border-[#7D9D76] focus:ring-4 focus:ring-[#7D9D76]/25"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Workspace address
          <div className="mt-2 flex overflow-hidden rounded-md border border-[#7D9D76] focus-within:border-[#7D9D76] focus-within:ring-4 focus-within:ring-[#7D9D76]/25">
            <input
              name="slug"
              required
              minLength={2}
              maxLength={32}
              // Case-insensitive on purpose: the server action already
              // lowercases this before validating/using it — see
              // app/account/signup's old field for why this can't be a
              // strict [a-z0-9]+ browser pattern (mobile auto-capitalization).
              pattern="[A-Za-z0-9]+"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="acme"
              className="min-w-0 flex-1 px-4 py-3 lowercase outline-none"
            />
            <span className="flex items-center bg-slate-100 px-3 text-xs text-slate-500">
              .construct.shaoor-ai.com
            </span>
          </div>
          <span className="mt-2 block text-xs font-normal text-slate-500">
            One word using lowercase letters or numbers, must be unique.
          </span>
        </label>
        {/* Prominent, can't-miss callout: unlike every other field on this
            form, this one can never be changed once saved — it's the
            tenant's permanent website address. */}
        <div className="flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>This address is permanent.</strong> It becomes your
            website&apos;s URL and can&apos;t be changed later — choose it
            carefully before creating your workspace.
          </p>
        </div>
        <button className="w-full rounded-md bg-(image:--gradient-button-bg) px-4 py-3 font-semibold text-white hover:brightness-110">
          Create workspace
        </button>
      </form>
    </ConstructAuthShell>
  );
}
