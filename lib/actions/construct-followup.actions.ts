"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/construct-client";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { ConstructEntitlementError } from "@/lib/control/construct-subscription.service";
import { assertProposalFollowUpSchedulingAllowed, isAssigneeEligible } from "@/lib/services/construct-followup.service";
import { zonedWallTimeToUtc } from "@/lib/followups/timezone";

export type FollowUpActionState = { error: string } | null;

function requireEditor(role: string) {
  if (role === "VIEWER") throw new Error("PERMISSION_DENIED");
}

function parseDueAt(dueDate: string, dueTime: string, timezone: string): Date | null {
  if (!dueDate || !dueTime) return null;
  try {
    return zonedWallTimeToUtc(`${dueDate}T${dueTime}`, timezone);
  } catch {
    return null;
  }
}

const scheduleSchema = z.object({
  parentType: z.enum(["ENQUIRY", "PROPOSAL"]),
  parentId: z.string().trim().min(1),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(140, "Title must be 140 characters or fewer."),
  note: z.string().trim().max(2000).transform((v) => v || null),
  assigneeId: z.string().trim().transform((v) => v || null),
  dueDate: z.string().trim().min(1, "Choose a due date."),
  dueTime: z.string().trim().min(1, "Choose a due time."),
});

// --- Create -----------------------------------------------------------
//
// Entitlement mapping (see FollowUp's schema comment for the full
// reasoning): an enquiry follow-up is never entitlement-gated (enquiries
// themselves aren't); a proposal follow-up requires PROJECT_PROPOSALS,
// same as scheduling any other new proposal work.
export async function createFollowUpAction(_prevState: FollowUpActionState, formData: FormData): Promise<FollowUpActionState> {
  const context = await requireActiveConstructContext();
  try {
    requireEditor(context.role);
  } catch {
    return { error: "You do not have permission to schedule follow-ups." };
  }

  const raw = Object.fromEntries(Object.keys(scheduleSchema.shape).map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid follow-up." };
  const { parentType, parentId, title, note, assigneeId, dueDate, dueTime } = parsed.data;

  const dueAt = parseDueAt(dueDate, dueTime, context.organization.timezone);
  if (!dueAt) return { error: "Enter a valid due date and time." };

  const prisma = getConstructPrisma();

  if (parentType === "PROPOSAL") {
    try {
      await assertProposalFollowUpSchedulingAllowed(context.organizationId);
    } catch (error) {
      if (error instanceof ConstructEntitlementError) return { error: error.message };
      throw error;
    }
    const proposal = await prisma.proposal.findFirst({ where: { id: parentId, organizationId: context.organizationId }, select: { id: true } });
    if (!proposal) return { error: "Proposal not found." };
  } else {
    const enquiry = await prisma.contactMessage.findFirst({ where: { id: parentId, organizationId: context.organizationId }, select: { id: true } });
    if (!enquiry) return { error: "Enquiry not found." };
  }

  // Default assignment to the creator when eligible (the creator is
  // always non-VIEWER, having passed requireEditor above, so this is
  // always eligible).
  const resolvedAssigneeId = assigneeId ?? context.userId;
  if (assigneeId) {
    const eligible = await isAssigneeEligible(context.organizationId, assigneeId);
    if (!eligible) return { error: "Choose an active team member who is not a Viewer." };
  }

  const parentFilter = parentType === "PROPOSAL" ? { proposalId: parentId } : { enquiryId: parentId };

  // Duplicate-submission guard: a double-click or a retried request
  // within a short window reuses the just-created follow-up instead of
  // creating a second, identical one.
  const recentDuplicate = await prisma.followUp.findFirst({
    where: { organizationId: context.organizationId, ...parentFilter, status: "OPEN", title, dueAt, assigneeId: resolvedAssigneeId, createdById: context.userId, createdAt: { gte: new Date(Date.now() - 10_000) } },
    select: { id: true },
  });
  if (recentDuplicate) {
    revalidatePathsForParent(parentType, parentId);
    return null;
  }

  await prisma.$transaction(async (tx) => {
    const followUp = await tx.followUp.create({
      data: { organizationId: context.organizationId, ...parentFilter, title, note, dueAt, assigneeId: resolvedAssigneeId, createdById: context.userId },
    });
    await tx.auditLog.create({
      data: { organizationId: context.organizationId, actorUserId: context.userId, module: "followups", action: "create", recordId: followUp.id, title: `Follow-up scheduled: ${title}`, details: { parentType, parentId, dueAt: dueAt.toISOString(), assigneeId: resolvedAssigneeId } },
    });
  });

  revalidatePathsForParent(parentType, parentId);
  return null;
}

// --- Edit / reassign / reschedule --------------------------------------
//
// A single action covers title/note edits, reassignment and
// rescheduling (they're the same form) — the audit action name reflects
// whichever changed, with dueAt taking priority since it's the one that
// can be entitlement-gated. A proposal follow-up's dueAt can only move
// forward if PROJECT_PROPOSALS is still entitled; title/note/assignee
// edits are never gated (assignment must keep working even after
// entitlement loss, so a removed assignee can always be replaced).
const updateSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(140, "Title must be 140 characters or fewer."),
  note: z.string().trim().max(2000).transform((v) => v || null),
  assigneeId: z.string().trim().transform((v) => v || null),
  dueDate: z.string().trim().min(1, "Choose a due date."),
  dueTime: z.string().trim().min(1, "Choose a due time."),
});

export async function updateFollowUpAction(_prevState: FollowUpActionState, formData: FormData): Promise<FollowUpActionState> {
  const context = await requireActiveConstructContext();
  try {
    requireEditor(context.role);
  } catch {
    return { error: "You do not have permission to manage follow-ups." };
  }

  const raw = Object.fromEntries(Object.keys(updateSchema.shape).map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid follow-up." };
  const { id, title, note, assigneeId, dueDate, dueTime } = parsed.data;

  const prisma = getConstructPrisma();
  const existing = await prisma.followUp.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!existing) return { error: "Follow-up not found." };
  if (existing.status !== "OPEN") return { error: `This follow-up is already ${existing.status.toLowerCase()} and can no longer be edited.` };

  const dueAt = parseDueAt(dueDate, dueTime, context.organization.timezone);
  if (!dueAt) return { error: "Enter a valid due date and time." };

  const dueAtChanged = dueAt.getTime() !== existing.dueAt.getTime();
  const assigneeChanged = (assigneeId ?? null) !== existing.assigneeId;

  if (dueAtChanged && existing.proposalId) {
    try {
      await assertProposalFollowUpSchedulingAllowed(context.organizationId);
    } catch (error) {
      if (error instanceof ConstructEntitlementError) return { error: error.message };
      throw error;
    }
  }
  if (assigneeId) {
    const eligible = await isAssigneeEligible(context.organizationId, assigneeId);
    if (!eligible) return { error: "Choose an active team member who is not a Viewer." };
  }

  const action = dueAtChanged ? "reschedule" : assigneeChanged ? "reassign" : "edit";
  const details: Record<string, unknown> = {};
  if (dueAtChanged) details.dueAt = { from: existing.dueAt.toISOString(), to: dueAt.toISOString() };
  if (assigneeChanged) details.assigneeId = { from: existing.assigneeId, to: assigneeId };
  if (title !== existing.title) details.title = { from: existing.title, to: title };

  await prisma.$transaction(async (tx) => {
    await tx.followUp.update({ where: { id }, data: { title, note, assigneeId: assigneeId ?? null, dueAt } });
    await tx.auditLog.create({
      data: { organizationId: context.organizationId, actorUserId: context.userId, module: "followups", action, recordId: id, title: `Follow-up ${action === "reschedule" ? "rescheduled" : action === "reassign" ? "reassigned" : "edited"}: ${title}`, details: details as Prisma.InputJsonValue },
    });
  });

  revalidatePathsForFollowUp(existing);
  return null;
}

// Compact quick-reschedule used by the dashboard list and the
// compact "Next follow-up" indicators — same rules as updateFollowUpAction's
// dueAt path, just without the rest of the edit form.
export async function quickRescheduleFollowUpAction(id: string, wallTime: string): Promise<{ error?: string }> {
  const context = await requireActiveConstructContext();
  try {
    requireEditor(context.role);
  } catch {
    return { error: "You do not have permission to manage follow-ups." };
  }

  const prisma = getConstructPrisma();
  const existing = await prisma.followUp.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!existing) return { error: "Follow-up not found." };
  if (existing.status !== "OPEN") return { error: `This follow-up is already ${existing.status.toLowerCase()}.` };

  let dueAt: Date;
  try {
    dueAt = zonedWallTimeToUtc(wallTime, context.organization.timezone);
  } catch {
    return { error: "Invalid due date/time." };
  }

  if (existing.proposalId) {
    try {
      await assertProposalFollowUpSchedulingAllowed(context.organizationId);
    } catch (error) {
      if (error instanceof ConstructEntitlementError) return { error: error.message };
      throw error;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.followUp.update({ where: { id }, data: { dueAt } });
    await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "followups", action: "reschedule", recordId: id, title: `Follow-up rescheduled: ${existing.title}`, details: { dueAt: { from: existing.dueAt.toISOString(), to: dueAt.toISOString() } } } });
  });

  revalidatePathsForFollowUp(existing);
  revalidatePath("/dashboard/followups");
  return {};
}

// --- Complete / cancel ---------------------------------------------------
// Never entitlement-gated (closing out existing work must always be
// possible, even after the parent feature's plan entitlement is lost —
// see the schema comment). Both are idempotent: retrying an
// already-completed/cancelled follow-up is a no-op success, not an
// error, so a flaky network resend can't fail visibly or double-log.

export async function completeFollowUpAction(id: string, outcomeNote: string): Promise<{ error?: string }> {
  const context = await requireActiveConstructContext();
  try {
    requireEditor(context.role);
  } catch {
    return { error: "You do not have permission to manage follow-ups." };
  }

  const prisma = getConstructPrisma();
  const existing = await prisma.followUp.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!existing) return { error: "Follow-up not found." };
  if (existing.status === "COMPLETED") { revalidatePath("/dashboard/followups"); return {}; }
  if (existing.status === "CANCELLED") return { error: "This follow-up was cancelled and cannot be completed." };

  const note = outcomeNote.trim().slice(0, 2000) || null;
  await prisma.$transaction(async (tx) => {
    await tx.followUp.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date(), completedById: context.userId, outcomeNote: note } });
    await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "followups", action: "complete", recordId: id, title: `Follow-up completed: ${existing.title}`, details: note ? { outcomeNote: note } : undefined } });
  });

  revalidatePathsForFollowUp(existing);
  revalidatePath("/dashboard/followups");
  revalidatePath("/dashboard");
  return {};
}

export async function cancelFollowUpAction(id: string): Promise<{ error?: string }> {
  const context = await requireActiveConstructContext();
  try {
    requireEditor(context.role);
  } catch {
    return { error: "You do not have permission to manage follow-ups." };
  }

  const prisma = getConstructPrisma();
  const existing = await prisma.followUp.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!existing) return { error: "Follow-up not found." };
  if (existing.status === "CANCELLED") { revalidatePath("/dashboard/followups"); return {}; }
  if (existing.status === "COMPLETED") return { error: "This follow-up was already completed and cannot be cancelled." };

  await prisma.$transaction(async (tx) => {
    await tx.followUp.update({ where: { id }, data: { status: "CANCELLED" } });
    await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "followups", action: "cancel", recordId: id, title: `Follow-up cancelled: ${existing.title}` } });
  });

  revalidatePathsForFollowUp(existing);
  revalidatePath("/dashboard/followups");
  revalidatePath("/dashboard");
  return {};
}

// --- Complete and schedule next (atomic) ---------------------------------
// Entitlement (when the next follow-up's parent is a proposal) is
// checked BEFORE the transaction opens: if it fails, nothing happens at
// all — the current follow-up stays exactly as it was, not completed,
// so the "current task is not completed while the next task is silently
// lost" requirement holds by construction rather than needing a
// compensating rollback.
const scheduleNextSchema = z.object({
  id: z.string().trim().min(1),
  outcomeNote: z.string().trim().max(2000).transform((v) => v || null),
  nextTitle: z.string().trim().min(2, "Next title must be at least 2 characters.").max(140, "Next title must be 140 characters or fewer."),
  nextNote: z.string().trim().max(2000).transform((v) => v || null),
  nextAssigneeId: z.string().trim().transform((v) => v || null),
  nextDueDate: z.string().trim().min(1, "Choose the next due date."),
  nextDueTime: z.string().trim().min(1, "Choose the next due time."),
});

export async function completeAndScheduleNextFollowUpAction(_prevState: FollowUpActionState, formData: FormData): Promise<FollowUpActionState> {
  const context = await requireActiveConstructContext();
  try {
    requireEditor(context.role);
  } catch {
    return { error: "You do not have permission to manage follow-ups." };
  }

  const raw = Object.fromEntries(Object.keys(scheduleNextSchema.shape).map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = scheduleNextSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid follow-up." };
  const { id, outcomeNote, nextTitle, nextNote, nextAssigneeId, nextDueDate, nextDueTime } = parsed.data;

  const prisma = getConstructPrisma();
  const existing = await prisma.followUp.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!existing) return { error: "Follow-up not found." };
  if (existing.status !== "OPEN") return { error: `This follow-up is already ${existing.status.toLowerCase()}.` };

  const nextDueAt = parseDueAt(nextDueDate, nextDueTime, context.organization.timezone);
  if (!nextDueAt) return { error: "Enter a valid due date and time for the next follow-up." };

  const resolvedNextAssigneeId = nextAssigneeId ?? context.userId;
  if (nextAssigneeId) {
    const eligible = await isAssigneeEligible(context.organizationId, nextAssigneeId);
    if (!eligible) return { error: "Choose an active team member who is not a Viewer for the next follow-up." };
  }

  // Gate before opening the transaction — see comment above.
  if (existing.proposalId) {
    try {
      await assertProposalFollowUpSchedulingAllowed(context.organizationId);
    } catch (error) {
      if (error instanceof ConstructEntitlementError) return { error: error.message };
      throw error;
    }
  }

  const parentFilter = existing.proposalId ? { proposalId: existing.proposalId } : { enquiryId: existing.enquiryId };
  const note = outcomeNote?.trim().slice(0, 2000) || null;

  await prisma.$transaction(async (tx) => {
    await tx.followUp.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date(), completedById: context.userId, outcomeNote: note } });
    const next = await tx.followUp.create({
      data: { organizationId: context.organizationId, ...parentFilter, title: nextTitle, note: nextNote, dueAt: nextDueAt, assigneeId: resolvedNextAssigneeId, createdById: context.userId },
    });
    await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "followups", action: "complete", recordId: id, title: `Follow-up completed: ${existing.title}`, details: { outcomeNote: note, nextFollowUpId: next.id } } });
    await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "followups", action: "create", recordId: next.id, title: `Follow-up scheduled: ${nextTitle}`, details: { previousFollowUpId: id, dueAt: nextDueAt.toISOString(), assigneeId: resolvedNextAssigneeId } } });
  });

  revalidatePathsForFollowUp(existing);
  revalidatePath("/dashboard/followups");
  revalidatePath("/dashboard");
  return null;
}

// --- Shared revalidation helpers ------------------------------------------

function revalidatePathsForParent(parentType: "ENQUIRY" | "PROPOSAL", parentId: string) {
  if (parentType === "PROPOSAL") revalidatePath(`/dashboard/proposals/${parentId}`);
  else revalidatePath(`/dashboard/messages/${parentId}`);
  revalidatePath("/dashboard/followups");
  revalidatePath("/dashboard");
}

function revalidatePathsForFollowUp(followUp: { enquiryId: string | null; proposalId: string | null }) {
  if (followUp.proposalId) revalidatePath(`/dashboard/proposals/${followUp.proposalId}`);
  if (followUp.enquiryId) revalidatePath(`/dashboard/messages/${followUp.enquiryId}`);
  revalidatePath("/dashboard/followups");
}
