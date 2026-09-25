import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";
import { enforceConstructBooleanEntitlement } from "@/lib/control/construct-subscription.service";

const FEATURE_CODE = "PRIVATE_PROJECT_PROGRESS";

// Scheduling/editing/publishing/issuing-access all gate on this — see
// the schema's own ProgressProject comment for the full policy
// (preserve data, allow read-only + revoke on loss, block everything
// that creates or changes customer-visible state).
export async function assertProgressEntitlement(organizationId: string) {
  await enforceConstructBooleanEntitlement(organizationId, FEATURE_CODE);
}

export type ProgressListRow = {
  id: string;
  title: string;
  customerName: string;
  lifecycle: string;
  currentStage: string | null;
  lastPublishedUpdateAt: Date | null;
  hasDraftChanges: boolean;
  customerAccessEnabled: boolean;
  updatedAt: Date;
};

export async function listProgressProjects(
  organizationId: string,
  filters: { search?: string; lifecycle?: string },
): Promise<ProgressListRow[]> {
  const prisma = getConstructPrisma();
  const projects = await prisma.progressProject.findMany({
    where: {
      organizationId,
      ...(filters.lifecycle ? { lifecycle: filters.lifecycle as never } : {}),
      ...(filters.search
        ? { OR: [{ title: { contains: filters.search, mode: "insensitive" } }, { customerName: { contains: filters.search, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      snapshots: { orderBy: { revisionNumber: "desc" }, take: 1, select: { publishedAt: true } },
      milestones: { select: { updatedAt: true } },
      updates: { where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 1, select: { publishedAt: true } },
    },
    take: 200,
  });

  return projects.map((p) => {
    const latestSnapshotAt = p.snapshots[0]?.publishedAt ?? null;
    const milestonesChangedSincePublish = p.milestones.some((m) => !latestSnapshotAt || m.updatedAt > latestSnapshotAt);
    const projectChangedSincePublish = !latestSnapshotAt || p.updatedAt > latestSnapshotAt;
    return {
      id: p.id,
      title: p.title,
      customerName: p.customerName,
      lifecycle: p.lifecycle,
      currentStage: p.currentStage,
      lastPublishedUpdateAt: p.updates[0]?.publishedAt ?? null,
      hasDraftChanges: projectChangedSincePublish || milestonesChangedSincePublish,
      customerAccessEnabled: Boolean(p.accessTokenHash) && !p.accessRevokedAt && (!p.accessExpiresAt || p.accessExpiresAt > new Date()),
      updatedAt: p.updatedAt,
    };
  });
}

// Diff surfaced on the project workspace so staff can see exactly what
// "Publish changes" would push live — never inferred silently.
export async function getProgressPendingChanges(organizationId: string, projectId: string) {
  const prisma = getConstructPrisma();
  const [project, latestSnapshot, milestones] = await Promise.all([
    prisma.progressProject.findFirstOrThrow({ where: { id: projectId, organizationId } }),
    prisma.progressSnapshot.findFirst({ where: { organizationId, projectId }, orderBy: { revisionNumber: "desc" } }),
    prisma.progressMilestone.findMany({ where: { organizationId, projectId }, orderBy: { sortOrder: "asc" } }),
  ]);

  const publishedAt = latestSnapshot?.publishedAt ?? null;
  const summaryChanged = !publishedAt || project.updatedAt > publishedAt;
  const milestonesChanged = !publishedAt || milestones.some((m) => m.updatedAt > publishedAt);

  return {
    hasNeverPublished: !latestSnapshot,
    summaryChanged,
    milestonesChanged,
    hasPendingChanges: summaryChanged || milestonesChanged,
    lastPublishedAt: publishedAt,
  };
}

export async function getMilestoneCompletion(organizationId: string, projectId: string): Promise<{ completed: number; total: number }> {
  const prisma = getConstructPrisma();
  const [completed, total] = await Promise.all([
    prisma.progressMilestone.count({ where: { organizationId, projectId, status: "COMPLETED" } }),
    prisma.progressMilestone.count({ where: { organizationId, projectId } }),
  ]);
  return { completed, total };
}

// Candidate lists for the "link to an existing enquiry/proposal/portfolio
// project" pickers on the create/edit form — always org-scoped.
export async function getProgressLinkCandidates(organizationId: string) {
  const prisma = getConstructPrisma();
  const [enquiries, proposals, portfolioProjects] = await Promise.all([
    prisma.contactMessage.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, subject: true, createdAt: true } }),
    prisma.proposal.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, reference: true, title: true } }),
    prisma.project.findMany({ where: { organizationId, isSample: false }, orderBy: { updatedAt: "desc" }, take: 100, select: { id: true, title: true } }),
  ]);
  return { enquiries, proposals, portfolioProjects };
}
