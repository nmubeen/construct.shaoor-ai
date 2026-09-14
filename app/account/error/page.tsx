import Link from "next/link";

import { ConstructAuthShell } from "@/components/auth/ConstructAuthShell";

// Deliberately generic copy for every reason (membership-suspended/
// -inactive/-unavailable) — see lib/auth/membership.ts's membershipError()
// comment for why these must never be distinguishable to the caller.
export default async function ConstructAuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  await searchParams;

  return (
    <ConstructAuthShell
      eyebrow="Access unavailable"
      title="We couldn't sign you in"
      description="Your account doesn't currently have access to Construct. Contact Shaoor AI if you believe this is a mistake."
    >
      <Link
        href="/account/login"
        className="block w-full rounded-md border border-[#7D9D76] px-4 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
      >
        Back to sign in
      </Link>
    </ConstructAuthShell>
  );
}
