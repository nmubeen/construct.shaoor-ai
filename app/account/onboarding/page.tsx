import { redirect } from "next/navigation";

import { ConstructAuthShell } from "@/components/auth/ConstructAuthShell";
import { provisionConstructOrganizationAction } from "@/lib/actions/construct-auth.actions";
import { getOptionalConstructContext } from "@/lib/auth/construct-context";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const context = await getOptionalConstructContext();
  if (!context) redirect("/account/login");
  if (context.membership) redirect(context.organization?.status === "ACTIVE" ? "/dashboard" : "/account/pending");
  const { error } = await searchParams;

  return (
    <ConstructAuthShell eyebrow="Organization setup" title="Create your workspace" description="Your website remains private until Shaoor AI activates its offline subscription.">
      <form action={provisionConstructOrganizationAction} className="space-y-5">
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-semibold text-slate-700">Company name<input name="organizationName" required minLength={2} maxLength={100} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100" /></label>
        <label className="block text-sm font-semibold text-slate-700">Workspace address<div className="mt-2 flex overflow-hidden rounded-xl border border-slate-300 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100"><input name="organizationSlug" required pattern="[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?" placeholder="your-company" className="min-w-0 flex-1 px-4 py-3 outline-none" /><span className="flex items-center bg-slate-100 px-3 text-xs text-slate-500">.construct.shaoor-ai.com</span></div></label>
        <button className="w-full rounded-xl bg-[#0E4A7B] px-4 py-3 font-semibold text-white hover:bg-[#0A365A]">Create workspace</button>
      </form>
    </ConstructAuthShell>
  );
}
