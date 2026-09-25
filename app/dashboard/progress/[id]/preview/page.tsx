import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProgressContentView } from "@/components/progress/ProgressContentView";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { buildConstructProgressSnapshot } from "@/lib/services/construct-progress-snapshot.service";
import { signProgressPhotos } from "@/lib/services/construct-progress-media.service";

// Dashboard-only preview of the CURRENT working copy — never the public
// /progress/[token] route, and never recorded as a customer "open" (see
// construct-progress-public.service.ts). Reuses
// buildConstructProgressSnapshot, the same function "Publish changes"
// uses to freeze a revision, just without persisting the result — so
// "preview" and "what actually gets published" can never drift apart.
// Published updates are shown live (same as the public page); unpublished
// draft updates are NOT shown here — they have their own explicit
// publish step, and this page previews the summary/milestones publish
// action specifically. No token is generated, read, or exposed anywhere
// on this route.
export default async function ProgressPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireActiveConstructContext();
  const { id } = await params;
  const prisma = getConstructPrisma();
  const project = await prisma.progressProject.findFirst({ where: { id, organizationId: context.organizationId }, select: { id: true, currentRevisionNumber: true } });
  if (!project) notFound();

  const [snapshot, publishedUpdates] = await Promise.all([
    buildConstructProgressSnapshot(id, project.currentRevisionNumber + 1),
    prisma.progressUpdate.findMany({ where: { organizationId: context.organizationId, projectId: id, status: "PUBLISHED" }, orderBy: { updateDate: "desc" }, include: { photos: { orderBy: { sortOrder: "asc" } } } }),
  ]);

  const updates = await Promise.all(
    publishedUpdates.map(async (u) => ({
      id: u.id,
      updateDate: u.updateDate.toISOString(),
      title: u.title,
      workCompleted: u.workCompleted,
      workInProgress: u.workInProgress,
      nextPlannedActivity: u.nextPlannedActivity,
      issueNote: u.issueNote,
      photos: await signProgressPhotos(u.photos.map((p) => ({ id: p.id, storagePath: p.storagePath, publicImageUrl: p.publicImageUrl, caption: p.caption }))),
    })),
  );
  const milestoneCompletion = { completed: snapshot.milestones.filter((m) => m.status === "COMPLETED").length, total: snapshot.milestones.length };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href={`/dashboard/progress/${id}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-(--color-secondary-text-icon)"><ArrowLeft className="size-4" />Back to workspace</Link>
        <p className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Preview only — the summary and milestones reflect your current draft, not necessarily what the customer currently sees. Publish changes to make edits live. Updates shown below are already published.</p>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <ProgressContentView snapshot={snapshot} updates={updates} milestoneCompletion={milestoneCompletion} />
        </div>
      </div>
    </div>
  );
}
