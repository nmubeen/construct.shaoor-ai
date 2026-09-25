"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/construct-client";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { ConstructEntitlementError } from "@/lib/control/construct-subscription.service";
import { assertProgressEntitlement } from "@/lib/services/construct-progress.service";
import { buildConstructProgressSnapshot } from "@/lib/services/construct-progress-snapshot.service";
import { deleteProgressPhotoObjects } from "@/lib/services/construct-progress-media.service";
import { generateProgressToken, hashProgressToken } from "@/lib/progress-token";

export type ProgressActionState = { error: string } | null;
// The raw token is only ever available in the return value of a
// generate/rotate action — never persisted anywhere in plaintext (see
// lib/progress-token.ts). A plain union (not an intersection with
// ProgressActionState) keeps "has an error" and "has a token" mutually
// exclusive and easy for a client component to branch on.
export type ProgressAccessActionState = { error: string } | { token: string } | null;

// Role policy (see the schema's own comments + the product spec):
// Owner/Admin can do everything an Editor can, plus the four actions
// that change what's externally visible or reachable (publish changes,
// publish/withdraw an update, generate/rotate/revoke access). Editors
// can create/edit the working copy and drafts but never publish or
// touch access. Viewers are read-only everywhere. Withdrawing an
// update, discarding a never-published draft, and revoking access are
// the three actions that only ever REDUCE customer-visible exposure —
// they stay available even without the entitlement (see
// assertProgressEntitlement's own callers below) and even for read-only
// recovery after entitlement loss, matching the schema's documented
// policy.
function requireEditor(role: string) {
  if (role === "VIEWER") throw new Error("PERMISSION_DENIED");
}
function requireApprover(role: string) {
  if (role !== "OWNER" && role !== "ADMIN") throw new Error("PERMISSION_DENIED");
}

async function entitlementErrorOrThrow(error: unknown): Promise<{ error: string }> {
  if (error instanceof ConstructEntitlementError) return { error: error.message };
  throw error;
}

// --- Project: create / edit / lifecycle --------------------------------

const projectSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(200),
  customerName: z.string().trim().min(1, "Customer name is required.").max(200),
  customerEmail: z.string().trim().max(320).transform((v) => v || null),
  customerPhone: z.string().trim().max(40).transform((v) => v || null),
  location: z.string().trim().max(300).transform((v) => v || null),
  locationCustomerVisible: z.string().optional().transform((v) => v === "on"),
  customerSummary: z.string().trim().max(4000),
  internalNotes: z.string().trim().max(4000).transform((v) => v || null),
  enquiryId: z.string().trim().transform((v) => v || null),
  proposalId: z.string().trim().transform((v) => v || null),
  portfolioProjectId: z.string().trim().transform((v) => v || null),
  plannedStartDate: z.string().trim().transform((v) => (v ? new Date(v) : null)),
  targetCompletionDate: z.string().trim().transform((v) => (v ? new Date(v) : null)),
  currentStage: z.string().trim().max(200).transform((v) => v || null),
  nextPlannedActivity: z.string().trim().max(500).transform((v) => v || null),
});

async function validateOptionalLinks(organizationId: string, data: { enquiryId: string | null; proposalId: string | null; portfolioProjectId: string | null }) {
  const prisma = getConstructPrisma();
  if (data.enquiryId) {
    const found = await prisma.contactMessage.findFirst({ where: { id: data.enquiryId, organizationId }, select: { id: true } });
    if (!found) return "Selected enquiry not found.";
  }
  if (data.proposalId) {
    const found = await prisma.proposal.findFirst({ where: { id: data.proposalId, organizationId }, select: { id: true } });
    if (!found) return "Selected proposal not found.";
  }
  if (data.portfolioProjectId) {
    const found = await prisma.project.findFirst({ where: { id: data.portfolioProjectId, organizationId }, select: { id: true } });
    if (!found) return "Selected portfolio project not found.";
  }
  return null;
}

export async function createProgressProjectAction(_prevState: ProgressActionState, formData: FormData): Promise<ProgressActionState> {
  const context = await requireActiveConstructContext();
  try {
    requireEditor(context.role);
  } catch {
    return { error: "You do not have permission to create a project." };
  }
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    return entitlementErrorOrThrow(error);
  }

  const raw = Object.fromEntries(Object.keys(projectSchema.shape).map((key) => [key, key === "locationCustomerVisible" ? formData.get(key) ?? undefined : String(formData.get(key) ?? "")]));
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid project." };

  const linkError = await validateOptionalLinks(context.organizationId, parsed.data);
  if (linkError) return { error: linkError };

  const prisma = getConstructPrisma();
  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.progressProject.create({ data: { organizationId: context.organizationId, ...parsed.data, createdById: context.userId } });
    await tx.auditLog.create({
      data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: "create", recordId: created.id, title: `Progress project created: ${created.title}` },
    });
    return created;
  });

  revalidatePath("/dashboard/progress");
  redirect(`/dashboard/progress/${project.id}`);
}

export async function updateProgressProjectAction(_prevState: ProgressActionState, formData: FormData): Promise<ProgressActionState> {
  const context = await requireActiveConstructContext();
  try {
    requireEditor(context.role);
  } catch {
    return { error: "You do not have permission to edit this project." };
  }
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    return entitlementErrorOrThrow(error);
  }

  const id = String(formData.get("id") ?? "");
  const raw = Object.fromEntries(Object.keys(projectSchema.shape).map((key) => [key, key === "locationCustomerVisible" ? formData.get(key) ?? undefined : String(formData.get(key) ?? "")]));
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid project." };

  const linkError = await validateOptionalLinks(context.organizationId, parsed.data);
  if (linkError) return { error: linkError };

  const prisma = getConstructPrisma();
  const updated = await prisma.progressProject.updateMany({ where: { id, organizationId: context.organizationId }, data: parsed.data });
  if (updated.count !== 1) return { error: "Project not found." };
  await prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: "edit", recordId: id, title: "Progress project details edited" } });

  revalidatePath(`/dashboard/progress/${id}`);
  revalidatePath("/dashboard/progress");
  return null;
}

const lifecycleValues = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"] as const;

export async function setProgressLifecycleAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) redirect(`/dashboard/progress?error=${encodeURIComponent(error.message)}`);
    throw error;
  }

  const id = String(formData.get("id") ?? "");
  const lifecycle = String(formData.get("lifecycle") ?? "");
  if (!lifecycleValues.includes(lifecycle as (typeof lifecycleValues)[number])) redirect(`/dashboard/progress/${id}?error=Invalid lifecycle state.`);

  const prisma = getConstructPrisma();
  const project = await prisma.progressProject.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!project) redirect("/dashboard/progress?error=Project not found.");

  // Archiving revokes access as a deliberate side effect (see the
  // product spec: "Archiving a project should ... revoke customer
  // access"). Completing does NOT revoke — access is preserved until
  // an explicit revoke, expiry, or another access condition blocks it.
  const shouldRevoke = lifecycle === "ARCHIVED" && project.accessTokenHash && !project.accessRevokedAt;

  await prisma.$transaction(async (tx) => {
    await tx.progressProject.update({ where: { id }, data: { lifecycle: lifecycle as (typeof lifecycleValues)[number], ...(shouldRevoke ? { accessRevokedAt: new Date() } : {}) } });
    await tx.auditLog.create({
      data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: "lifecycle_change", recordId: id, title: `Progress project moved to ${lifecycle}${shouldRevoke ? " (access revoked)" : ""}`, details: { from: project.lifecycle, to: lifecycle } },
    });
  });

  revalidatePath(`/dashboard/progress/${id}`);
  revalidatePath("/dashboard/progress");
  redirect(`/dashboard/progress/${id}?updated=1`);
}

// --- Publish changes (summary + milestones snapshot) --------------------

export async function publishProgressChangesAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireApprover(context.role);
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) redirect(`/dashboard/progress?error=${encodeURIComponent(error.message)}`);
    throw error;
  }

  const id = String(formData.get("id") ?? "");
  const prisma = getConstructPrisma();

  await prisma.$transaction(async (tx) => {
    // Row lock prevents two concurrent "Publish changes" clicks from
    // both reading the same currentRevisionNumber and creating
    // conflicting revision rows — same convention as
    // updateConstructPublicationAction's FOR UPDATE lock.
    await tx.$queryRaw`SELECT id FROM construct.progress_projects WHERE id = ${id}::uuid AND organization_id = ${context.organizationId}::uuid FOR UPDATE`;
    const project = await tx.progressProject.findFirst({ where: { id, organizationId: context.organizationId } });
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const nextRevisionNumber = project.currentRevisionNumber + 1;
    const snapshot = await buildConstructProgressSnapshot(id, nextRevisionNumber);
    await tx.progressSnapshot.create({ data: { organizationId: context.organizationId, projectId: id, revisionNumber: nextRevisionNumber, snapshot: snapshot as unknown as Prisma.InputJsonValue, publishedById: context.userId } });
    await tx.progressProject.update({ where: { id }, data: { currentRevisionNumber: nextRevisionNumber } });
    await tx.auditLog.create({
      data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: nextRevisionNumber === 1 ? "publish" : "republish", recordId: id, title: `Progress page ${nextRevisionNumber === 1 ? "published" : "republished"} (revision ${nextRevisionNumber})` },
    });
  }).catch((error) => {
    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") redirect("/dashboard/progress?error=Project not found.");
    throw error;
  });

  revalidatePath(`/dashboard/progress/${id}`);
  revalidatePath("/dashboard/progress");
  redirect(`/dashboard/progress/${id}?published=1`);
}

// --- Milestones ----------------------------------------------------------

const milestoneSchema = z.object({
  title: z.string().trim().min(2, "Milestone title must be at least 2 characters.").max(200),
  description: z.string().trim().max(2000).transform((v) => v || null),
  plannedDate: z.string().trim().transform((v) => (v ? new Date(v) : null)),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  completedDate: z.string().trim().transform((v) => (v ? new Date(v) : null)),
});

export async function addMilestoneAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) redirect(`/dashboard/progress?error=${encodeURIComponent(error.message)}`);
    throw error;
  }

  const projectId = String(formData.get("projectId") ?? "");
  const raw = Object.fromEntries(Object.keys(milestoneSchema.shape).map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = milestoneSchema.safeParse(raw);
  if (!parsed.success) redirect(`/dashboard/progress/${projectId}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid milestone.")}`);

  const prisma = getConstructPrisma();
  const project = await prisma.progressProject.findFirst({ where: { id: projectId, organizationId: context.organizationId }, select: { id: true } });
  if (!project) redirect("/dashboard/progress?error=Project not found.");

  const maxOrder = await prisma.progressMilestone.aggregate({ where: { projectId }, _max: { sortOrder: true } });
  await prisma.progressMilestone.create({ data: { organizationId: context.organizationId, projectId, ...parsed.data, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 } });
  await prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: "milestone_add", recordId: projectId, title: `Milestone added: ${parsed.data.title}` } });

  revalidatePath(`/dashboard/progress/${projectId}`);
  redirect(`/dashboard/progress/${projectId}?updated=1`);
}

export async function updateMilestoneAction(_prevState: ProgressActionState, formData: FormData): Promise<ProgressActionState> {
  const context = await requireActiveConstructContext();
  try {
    requireEditor(context.role);
  } catch {
    return { error: "You do not have permission to edit milestones." };
  }
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    return entitlementErrorOrThrow(error);
  }

  const id = String(formData.get("id") ?? "");
  const raw = Object.fromEntries(Object.keys(milestoneSchema.shape).map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = milestoneSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid milestone." };

  const prisma = getConstructPrisma();
  const existing = await prisma.progressMilestone.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!existing) return { error: "Milestone not found." };

  await prisma.$transaction([
    prisma.progressMilestone.update({ where: { id }, data: parsed.data }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: "milestone_edit", recordId: existing.projectId, title: `Milestone edited: ${parsed.data.title}` } }),
  ]);

  revalidatePath(`/dashboard/progress/${existing.projectId}`);
  return null;
}

export async function reorderMilestonesAction(projectId: string, orderedIds: string[]): Promise<{ error?: string }> {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") return { error: "You do not have permission to reorder milestones." };
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) return { error: error.message };
    throw error;
  }

  const prisma = getConstructPrisma();
  const existing = await prisma.progressMilestone.findMany({ where: { organizationId: context.organizationId, projectId }, select: { id: true } });
  if (existing.length !== orderedIds.length || !orderedIds.every((id) => existing.some((row) => row.id === id))) {
    return { error: "The milestone list changed. Refresh the page and try again." };
  }
  await prisma.$transaction(orderedIds.map((id, index) => prisma.progressMilestone.updateMany({ where: { id, projectId, organizationId: context.organizationId }, data: { sortOrder: index } })));
  revalidatePath(`/dashboard/progress/${projectId}`);
  return {};
}

// --- Updates ---------------------------------------------------------------

export async function createProgressUpdateDraftAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) redirect(`/dashboard/progress?error=${encodeURIComponent(error.message)}`);
    throw error;
  }

  const projectId = String(formData.get("projectId") ?? "");
  const prisma = getConstructPrisma();
  const project = await prisma.progressProject.findFirst({ where: { id: projectId, organizationId: context.organizationId }, select: { id: true } });
  if (!project) redirect("/dashboard/progress?error=Project not found.");

  const update = await prisma.$transaction(async (tx) => {
    const created = await tx.progressUpdate.create({
      data: { organizationId: context.organizationId, projectId, updateDate: new Date(), title: "New update", createdById: context.userId },
    });
    await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: "update_draft_create", recordId: created.id, title: "Progress update draft created" } });
    return created;
  });

  revalidatePath(`/dashboard/progress/${projectId}`);
  redirect(`/dashboard/progress/${projectId}/updates/${update.id}`);
}

const updateContentSchema = z.object({
  updateDate: z.string().trim().min(1, "Choose an update date."),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(200),
  workCompleted: z.string().trim().max(4000),
  workInProgress: z.string().trim().max(4000),
  nextPlannedActivity: z.string().trim().max(2000),
  issueNote: z.string().trim().max(2000).transform((v) => v || null),
  milestoneId: z.string().trim().transform((v) => v || null),
});

export async function updateProgressUpdateAction(_prevState: ProgressActionState, formData: FormData): Promise<ProgressActionState> {
  const context = await requireActiveConstructContext();
  try {
    requireEditor(context.role);
  } catch {
    return { error: "You do not have permission to edit updates." };
  }

  const id = String(formData.get("id") ?? "");
  const prisma = getConstructPrisma();
  const existing = await prisma.progressUpdate.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!existing) return { error: "Update not found." };
  if (existing.status === "WITHDRAWN") return { error: "A withdrawn update can no longer be edited." };
  // Editors can edit their own drafts; editing an already-PUBLISHED
  // update is Owner/Admin only (see the product spec).
  if (existing.status === "PUBLISHED") {
    try {
      requireApprover(context.role);
    } catch {
      return { error: "Only Owners and Admins can edit a published update." };
    }
  }

  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    return entitlementErrorOrThrow(error);
  }

  const raw = Object.fromEntries(Object.keys(updateContentSchema.shape).map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = updateContentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid update." };
  const { updateDate, milestoneId, ...rest } = parsed.data;
  const parsedDate = new Date(updateDate);
  if (Number.isNaN(parsedDate.getTime())) return { error: "Enter a valid update date." };

  if (milestoneId) {
    const milestone = await prisma.progressMilestone.findFirst({ where: { id: milestoneId, organizationId: context.organizationId, projectId: existing.projectId }, select: { id: true } });
    if (!milestone) return { error: "Selected milestone not found." };
  }

  await prisma.$transaction([
    prisma.progressUpdate.update({ where: { id }, data: { ...rest, updateDate: parsedDate, milestoneId } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: "update_edit", recordId: id, title: `Progress update edited: ${rest.title}` } }),
  ]);

  revalidatePath(`/dashboard/progress/${existing.projectId}`);
  revalidatePath(`/dashboard/progress/${existing.projectId}/updates/${id}`);
  return null;
}

export async function publishProgressUpdateAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireApprover(context.role);
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) redirect(`/dashboard/progress?error=${encodeURIComponent(error.message)}`);
    throw error;
  }

  const id = String(formData.get("id") ?? "");
  const prisma = getConstructPrisma();
  const existing = await prisma.progressUpdate.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!existing) redirect("/dashboard/progress?error=Update not found.");
  if (existing.status === "PUBLISHED") redirect(`/dashboard/progress/${existing.projectId}/updates/${id}?updated=1`); // idempotent, retry-safe
  if (existing.status === "WITHDRAWN") redirect(`/dashboard/progress/${existing.projectId}/updates/${id}?error=${encodeURIComponent("A withdrawn update must be edited and treated as a new draft before it can be published again.")}`);
  if (!existing.title.trim() || !existing.workCompleted.trim()) redirect(`/dashboard/progress/${existing.projectId}/updates/${id}?error=${encodeURIComponent("Add a title and what work was completed before publishing.")}`);

  await prisma.$transaction([
    prisma.progressUpdate.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date(), publishedById: context.userId } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: "update_publish", recordId: id, title: `Progress update published: ${existing.title}` } }),
  ]);

  revalidatePath(`/dashboard/progress/${existing.projectId}`);
  revalidatePath(`/dashboard/progress/${existing.projectId}/updates/${id}`);
  redirect(`/dashboard/progress/${existing.projectId}/updates/${id}?published=1`);
}

// Withdraw only ever REDUCES customer-visible exposure, so — same as
// revoking access — it stays available even without the entitlement;
// role (Owner/Admin) is still required.
export async function withdrawProgressUpdateAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireApprover(context.role);

  const id = String(formData.get("id") ?? "");
  const prisma = getConstructPrisma();
  const existing = await prisma.progressUpdate.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!existing) redirect("/dashboard/progress?error=Update not found.");
  if (existing.status === "WITHDRAWN") redirect(`/dashboard/progress/${existing.projectId}/updates/${id}?withdrawn=1`); // idempotent
  if (existing.status !== "PUBLISHED") redirect(`/dashboard/progress/${existing.projectId}/updates/${id}?error=Only a published update can be withdrawn.`);

  await prisma.$transaction([
    prisma.progressUpdate.update({ where: { id }, data: { status: "WITHDRAWN", withdrawnAt: new Date(), withdrawnById: context.userId } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: "update_withdraw", recordId: id, title: `Progress update withdrawn: ${existing.title}` } }),
  ]);

  revalidatePath(`/dashboard/progress/${existing.projectId}`);
  revalidatePath(`/dashboard/progress/${existing.projectId}/updates/${id}`);
  redirect(`/dashboard/progress/${existing.projectId}/updates/${id}?withdrawn=1`);
}

// Discard a draft that was never published — the "safe, scoped cleanup
// strategy" for an abandoned mobile update (see the product spec).
// Deliberately not entitlement-gated: it only ever removes never-published
// content, never creates or extends customer-visible exposure.
export async function discardProgressUpdateDraftAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);

  const id = String(formData.get("id") ?? "");
  const prisma = getConstructPrisma();
  const existing = await prisma.progressUpdate.findFirst({ where: { id, organizationId: context.organizationId }, include: { photos: { select: { storagePath: true } } } });
  if (!existing) redirect("/dashboard/progress?error=Update not found.");
  if (existing.status !== "DRAFT") redirect(`/dashboard/progress/${existing.projectId}/updates/${id}?error=Only a draft can be discarded.`);

  const storagePaths = existing.photos.map((p) => p.storagePath).filter((p): p is string => Boolean(p));
  await deleteProgressPhotoObjects(storagePaths);

  await prisma.$transaction([
    prisma.progressUpdate.delete({ where: { id } }), // cascades progress_photos
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: "update_discard", recordId: id, title: `Progress update draft discarded: ${existing.title}` } }),
  ]);

  revalidatePath(`/dashboard/progress/${existing.projectId}`);
  redirect(`/dashboard/progress/${existing.projectId}?discarded=1`);
}

// --- Photos (attach an existing PUBLIC portfolio image; remove/reorder) --

export async function addPublicReferencePhotoAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) redirect(`/dashboard/progress?error=${encodeURIComponent(error.message)}`);
    throw error;
  }

  const updateId = String(formData.get("updateId") ?? "");
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 300) || null;
  if (!imageUrl) redirect(`/dashboard/progress/updates/${updateId}?error=Choose an image.`);

  const prisma = getConstructPrisma();
  const update = await prisma.progressUpdate.findFirst({ where: { id: updateId, organizationId: context.organizationId }, select: { id: true, projectId: true, status: true } });
  if (!update) redirect("/dashboard/progress?error=Update not found.");
  if (update.status === "WITHDRAWN") redirect(`/dashboard/progress/${update.projectId}/updates/${updateId}?error=A withdrawn update cannot be changed.`);

  const maxOrder = await prisma.progressPhoto.aggregate({ where: { updateId }, _max: { sortOrder: true } });
  await prisma.progressPhoto.create({ data: { organizationId: context.organizationId, updateId, publicImageUrl: imageUrl, caption, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1, createdById: context.userId } });

  revalidatePath(`/dashboard/progress/${update.projectId}/updates/${updateId}`);
  redirect(`/dashboard/progress/${update.projectId}/updates/${updateId}`);
}

export async function removeProgressPhotoAction(updateId: string, photoId: string): Promise<{ error?: string }> {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") return { error: "You do not have permission to manage photos." };
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) return { error: error.message };
    throw error;
  }

  const prisma = getConstructPrisma();
  const photo = await prisma.progressPhoto.findFirst({ where: { id: photoId, organizationId: context.organizationId, updateId } });
  if (!photo) return {};
  if (photo.storagePath) await deleteProgressPhotoObjects([photo.storagePath]);
  await prisma.progressPhoto.delete({ where: { id: photoId } });
  revalidatePath(`/dashboard/progress`);
  return {};
}

export async function reorderProgressPhotosAction(updateId: string, orderedIds: string[]): Promise<{ error?: string }> {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") return { error: "You do not have permission to reorder photos." };
  try {
    await assertProgressEntitlement(context.organizationId);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) return { error: error.message };
    throw error;
  }

  const prisma = getConstructPrisma();
  const existing = await prisma.progressPhoto.findMany({ where: { organizationId: context.organizationId, updateId }, select: { id: true } });
  if (existing.length !== orderedIds.length || !orderedIds.every((id) => existing.some((row) => row.id === id))) {
    return { error: "The photo list changed. Refresh the page and try again." };
  }
  await prisma.$transaction(orderedIds.map((id, index) => prisma.progressPhoto.updateMany({ where: { id, updateId, organizationId: context.organizationId }, data: { sortOrder: index } })));
  return {};
}

// --- Share-link access (Owner/Admin only) --------------------------------

const MAX_ACCESS_EXPIRY_DAYS = 365;

async function issueProgressAccess(organizationId: string, userId: string, projectId: string, expiryDays: number | null, auditAction: "access_generate" | "access_rotate"): Promise<{ token: string } | { error: string }> {
  try {
    await assertProgressEntitlement(organizationId);
  } catch (error) {
    return { error: error instanceof ConstructEntitlementError ? error.message : "Could not issue access." };
  }
  const prisma = getConstructPrisma();
  const project = await prisma.progressProject.findFirst({ where: { id: projectId, organizationId } });
  if (!project) return { error: "Project not found." };

  const token = generateProgressToken();
  const tokenHash = hashProgressToken(token);
  const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null;

  await prisma.$transaction([
    prisma.progressProject.update({ where: { id: projectId }, data: { accessTokenHash: tokenHash, accessExpiresAt: expiresAt, accessCreatedAt: new Date(), accessRevokedAt: null } }),
    prisma.auditLog.create({ data: { organizationId, actorUserId: userId, module: "progress", action: auditAction, recordId: projectId, title: auditAction === "access_generate" ? "Customer access link generated" : "Customer access link rotated (previous link invalidated)" } }),
  ]);

  revalidatePath(`/dashboard/progress/${projectId}`);
  revalidatePath("/dashboard/progress");
  return { token };
}

export async function generateProgressAccessAction(_prevState: ProgressAccessActionState, formData: FormData): Promise<ProgressAccessActionState> {
  const context = await requireActiveConstructContext();
  try {
    requireApprover(context.role);
  } catch {
    return { error: "Only Owners and Admins can manage customer access." };
  }
  const projectId = String(formData.get("projectId") ?? "");
  const expiryDaysRaw = String(formData.get("expiryDays") ?? "").trim();
  const expiryDays = expiryDaysRaw ? Math.min(Number(expiryDaysRaw), MAX_ACCESS_EXPIRY_DAYS) : null;
  if (expiryDaysRaw && (!Number.isFinite(expiryDays) || (expiryDays as number) <= 0)) return { error: "Enter a valid number of days, or leave blank for no expiry." };

  const result = await issueProgressAccess(context.organizationId, context.userId, projectId, expiryDays, "access_generate");
  if ("error" in result) return { error: result.error };
  return { token: result.token };
}

export async function rotateProgressAccessAction(_prevState: ProgressAccessActionState, formData: FormData): Promise<ProgressAccessActionState> {
  const context = await requireActiveConstructContext();
  try {
    requireApprover(context.role);
  } catch {
    return { error: "Only Owners and Admins can manage customer access." };
  }
  const projectId = String(formData.get("projectId") ?? "");
  const prisma = getConstructPrisma();
  const project = await prisma.progressProject.findFirst({ where: { id: projectId, organizationId: context.organizationId }, select: { accessExpiresAt: true, accessCreatedAt: true } });
  // Rotation keeps the same expiry POLICY (an absolute date already set
  // stays put) rather than resetting it, since "rotate" is meant to
  // replace a compromised/mis-sent link, not silently extend its life.
  const expiryDays = project?.accessExpiresAt ? Math.max(1, Math.ceil((project.accessExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : null;

  const result = await issueProgressAccess(context.organizationId, context.userId, projectId, expiryDays, "access_rotate");
  if ("error" in result) return { error: result.error };
  return { token: result.token };
}

// Revoking only ever reduces exposure, so — unlike generate/rotate — it
// stays available even without the entitlement (see the schema's own
// comment and the product spec's explicit "allow ... revocation of
// existing links" during entitlement loss).
export async function revokeProgressAccessAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireApprover(context.role);

  const projectId = String(formData.get("projectId") ?? "");
  const prisma = getConstructPrisma();
  const project = await prisma.progressProject.findFirst({ where: { id: projectId, organizationId: context.organizationId } });
  if (!project) redirect("/dashboard/progress?error=Project not found.");
  if (!project.accessTokenHash || project.accessRevokedAt) redirect(`/dashboard/progress/${projectId}?revoked=1`); // idempotent, retry-safe

  await prisma.$transaction([
    prisma.progressProject.update({ where: { id: projectId }, data: { accessRevokedAt: new Date() } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "progress", action: "access_revoke", recordId: projectId, title: "Customer access link revoked" } }),
  ]);

  revalidatePath(`/dashboard/progress/${projectId}`);
  revalidatePath("/dashboard/progress");
  redirect(`/dashboard/progress/${projectId}?revoked=1`);
}
