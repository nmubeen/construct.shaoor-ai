import { redirect } from "next/navigation";

import { ProgressProjectForm } from "@/components/progress/ProgressProjectForm";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructEntitlements } from "@/lib/control/construct-subscription.service";
import { getProgressLinkCandidates } from "@/lib/services/construct-progress.service";

export default async function NewProgressProjectPage() {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") redirect("/dashboard/progress");

  const [linkCandidates, entitlements] = await Promise.all([
    getProgressLinkCandidates(context.organizationId),
    getConstructEntitlements(context.organizationId),
  ]);
  const isEntitled = Boolean(entitlements?.entitlements.find((e) => e.featureCode === "PRIVATE_PROJECT_PROGRESS")?.booleanValue);
  if (!isEntitled) redirect("/dashboard/progress?error=Private project progress pages are not included in the current plan.");

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="mb-6 text-3xl font-bold text-(--color-primary-text)">New progress project</h1>
      <ProgressProjectForm linkCandidates={linkCandidates} />
    </div>
  );
}
