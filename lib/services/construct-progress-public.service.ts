import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";
import { getConstructEntitlements } from "@/lib/control/construct-subscription.service";
import { hashProgressToken } from "@/lib/progress-token";
import { signProgressPhotos } from "@/lib/services/construct-progress-media.service";
import type { ProgressSnapshot } from "@/lib/services/construct-progress-snapshot.service";

const FEATURE_CODE = "PRIVATE_PROJECT_PROGRESS";

// Non-throwing check (unlike enforceConstructBooleanEntitlement) — the
// public route must render a generic "unavailable" page on a lost
// entitlement, never throw, and must never distinguish "entitlement
// lost" from "organization suspended" in what it shows a customer (see
// the product spec: no billing status leaks through this page).
export async function hasProgressEntitlement(organizationId: string): Promise<boolean> {
  const state = await getConstructEntitlements(organizationId);
  if (!state || !state.access.accessAllowed) return false;
  return Boolean(state.entitlements.find((e) => e.featureCode === FEATURE_CODE && e.valueType === "BOOLEAN")?.booleanValue);
}

export type ResolvedConstructProgressUpdate = {
  id: string;
  updateDate: string;
  title: string;
  workCompleted: string;
  workInProgress: string;
  nextPlannedActivity: string;
  issueNote: string | null;
  photos: Array<{ id: string; url: string; caption: string | null }>;
};

export type ResolvedConstructProgress = {
  projectId: string;
  organizationId: string;
  revisionNumber: number;
  snapshot: ProgressSnapshot;
  updates: ResolvedConstructProgressUpdate[];
  milestoneCompletion: { completed: number; total: number };
};

export type ResolveProgressResult =
  | { ok: true; progress: ResolvedConstructProgress }
  // Every failure renders the same honest-but-generic public page —
  // "unavailable" deliberately covers BOTH organization suspension and
  // entitlement loss, so neither ever leaks the company's billing
  // status to whoever holds the link (see the product spec).
  | { ok: false; reason: "not-found" | "revoked" | "expired" | "unavailable" };

// The ONLY way the public route resolves a progress project — by the
// SHA-256 hash of the exact bearer token, plus revocation/expiry/
// publication/organization-status/entitlement checks. Never a
// sequential id, never trusts anything else in the URL. A token that
// hashes to no row, an unrevoked-but-never-published project, and a
// project whose organization doesn't exist all return the same
// "not-found" — there is nothing in that response an attacker could
// use to distinguish "wrong token" from "right token, wrong state".
export async function resolveConstructProgressByToken(token: string): Promise<ResolveProgressResult> {
  if (!token || token.length < 20) return { ok: false, reason: "not-found" };
  const tokenHash = hashProgressToken(token);
  const prisma = getConstructPrisma();

  const project = await prisma.progressProject.findUnique({
    where: { accessTokenHash: tokenHash },
    include: { organization: { select: { status: true } } },
  });
  if (!project) return { ok: false, reason: "not-found" };
  if (project.organization.status !== "ACTIVE") return { ok: false, reason: "unavailable" };
  if (project.accessRevokedAt) return { ok: false, reason: "revoked" };
  if (project.accessExpiresAt && project.accessExpiresAt < new Date()) return { ok: false, reason: "expired" };
  if (!(await hasProgressEntitlement(project.organizationId))) return { ok: false, reason: "unavailable" };

  const latest = await prisma.progressSnapshot.findFirst({ where: { projectId: project.id }, orderBy: { revisionNumber: "desc" } });
  if (!latest) return { ok: false, reason: "not-found" }; // never published yet — shouldn't have a link, fail closed regardless

  const publishedUpdates = await prisma.progressUpdate.findMany({
    where: { organizationId: project.organizationId, projectId: project.id, status: "PUBLISHED" },
    orderBy: { updateDate: "desc" },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });

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

  const snapshot = latest.snapshot as unknown as ProgressSnapshot;
  const milestoneCompletion = {
    completed: snapshot.milestones.filter((m) => m.status === "COMPLETED").length,
    total: snapshot.milestones.length,
  };

  return {
    ok: true,
    progress: { projectId: project.id, organizationId: project.organizationId, revisionNumber: latest.revisionNumber, snapshot, updates, milestoneCompletion },
  };
}

// Aggregate-only view tracking, same dedupe convention as
// recordConstructProposalView (30-minute window).
const VIEW_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

export async function recordConstructProgressView(projectId: string): Promise<void> {
  const prisma = getConstructPrisma();
  const project = await prisma.progressProject.findUnique({ where: { id: projectId }, select: { firstOpenedAt: true, lastOpenedAt: true } });
  if (!project) return;
  const now = new Date();
  const isNewSession = !project.lastOpenedAt || now.getTime() - project.lastOpenedAt.getTime() > VIEW_DEDUPE_WINDOW_MS;
  await prisma.progressProject.update({
    where: { id: projectId },
    data: { firstOpenedAt: project.firstOpenedAt ?? now, lastOpenedAt: now, ...(isNewSession ? { openCount: { increment: 1 } } : {}) },
  });
}
