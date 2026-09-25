import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProgressProjectForm } from "@/components/progress/ProgressProjectForm";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { getConstructEntitlements } from "@/lib/control/construct-subscription.service";
import { getProgressLinkCandidates } from "@/lib/services/construct-progress.service";

export default async function EditProgressProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireActiveConstructContext();
  const { id } = await params;
  if (context.role === "VIEWER") redirect(`/dashboard/progress/${id}`);

  const [project, linkCandidates, entitlements] = await Promise.all([
    getConstructPrisma().progressProject.findFirst({ where: { id, organizationId: context.organizationId } }),
    getProgressLinkCandidates(context.organizationId),
    getConstructEntitlements(context.organizationId),
  ]);
  if (!project) notFound();
  const isEntitled = Boolean(entitlements?.entitlements.find((e) => e.featureCode === "PRIVATE_PROJECT_PROGRESS")?.booleanValue);
  if (!isEntitled) redirect(`/dashboard/progress/${id}?error=Private project progress pages are not included in the current plan.`);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Link href={`/dashboard/progress/${id}`} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-(--color-secondary-text-icon)"><ArrowLeft className="size-4" />Back to workspace</Link>
      <h1 className="mb-6 text-3xl font-bold text-(--color-primary-text)">Edit project details</h1>
      <ProgressProjectForm project={project} linkCandidates={linkCandidates} />
    </div>
  );
}
