import { redirect } from "next/navigation";

import { ConstructAuthShell } from "@/components/auth/ConstructAuthShell";
import { constructSignOutAction } from "@/lib/actions/construct-auth.actions";
import { getOptionalConstructContext } from "@/lib/auth/construct-context";
import { getConstructCommercialAccess } from "@/lib/control/construct-subscription.service";

export default async function ActivationPendingPage() {
  const context = await getOptionalConstructContext();
  if (!context) redirect("/account/login");
  if (!context.membership) redirect("/account/onboarding");
  const commercial=context.organization?await getConstructCommercialAccess(context.organization.id):null;
  const commerciallyBlocked=Boolean(commercial&&!commercial.accessAllowed);
  if (context.organization?.status === "ACTIVE"&&!commerciallyBlocked) redirect("/dashboard");

  return (
    <ConstructAuthShell eyebrow={commerciallyBlocked?"Access unavailable":"Activation pending"} title={commerciallyBlocked?"Your subscription needs attention":"Your workspace is ready"} description={commerciallyBlocked?"Contact Shaoor AI to restore access to this workspace.":"Shaoor AI will activate access after confirming your offline subscription."}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-semibold text-amber-950">{context.organization?.name}</p><p className="mt-1 text-sm text-amber-800">Status: {commerciallyBlocked?commercial?.status.toLowerCase():context.organization?.status.toLowerCase()}</p>{commerciallyBlocked&&<p className="mt-1 text-sm text-amber-800">Plan: {commercial?.planName}</p>}</div>
        <p className="text-sm leading-6 text-slate-600">No payment is required online. Contact Shaoor AI if your activation has already been approved.</p>
        <form action={constructSignOutAction}><button className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">Sign out</button></form>
      </div>
    </ConstructAuthShell>
  );
}
