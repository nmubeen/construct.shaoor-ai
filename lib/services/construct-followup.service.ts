import "server-only";

import type { Prisma } from "@prisma/construct-client";

import { getConstructPrisma } from "@/lib/construct-prisma";
import { enforceConstructBooleanEntitlement } from "@/lib/control/construct-subscription.service";
import { getTodayBoundsInZone } from "@/lib/followups/timezone";

const PROPOSAL_FEATURE_CODE = "PROJECT_PROPOSALS";

// --- Eligibility mapping -------------------------------------------------
// Enquiry follow-ups: enquiries themselves carry no plan/entitlement
// gating anywhere in this app (see construct-message.actions.ts — only
// role is checked), so an enquiry follow-up never calls this. Proposal
// follow-ups: gated by PROJECT_PROPOSALS, the same entitlement proposal
// create/edit/publish already enforce (construct-proposal.actions.ts) —
// but ONLY when scheduling new due work (creating a follow-up, or
// changing its dueAt/"rescheduling" an existing one). Completing or
// cancelling an existing proposal follow-up never calls this, so losing
// the entitlement can never strand a reminder no one can close out —
// see the ProposalStatus/FollowUpStatus schema comments for the same
// reasoning applied to proposals themselves.
export async function assertProposalFollowUpSchedulingAllowed(organizationId: string) {
  await enforceConstructBooleanEntitlement(organizationId, PROPOSAL_FEATURE_CODE);
}

// --- Assignee eligibility -------------------------------------------------
// "Active workspace member" = Membership.status === "ACTIVE" (not
// INVITED, not REMOVED) with a real user account; "eligible to be
// assigned" additionally excludes VIEWER, since a Viewer has no write
// access and could never complete the task (matches
// construct-message.actions.ts's `role === "VIEWER"` write gate).
export async function getEligibleAssignees(organizationId: string) {
  const memberships = await getConstructPrisma().membership.findMany({
    where: { organizationId, status: "ACTIVE", role: { not: "VIEWER" }, userId: { not: null } },
    include: { user: { select: { id: true, fullName: true, email: true } } },
    orderBy: { user: { fullName: "asc" } },
  });
  return memberships
    .filter((m) => m.user)
    .map((m) => ({ id: m.user!.id, name: m.user!.fullName || m.user!.email, email: m.user!.email }));
}

export async function isAssigneeEligible(organizationId: string, userId: string): Promise<boolean> {
  const membership = await getConstructPrisma().membership.findFirst({
    where: { organizationId, userId, status: "ACTIVE", role: { not: "VIEWER" } },
    select: { id: true },
  });
  return Boolean(membership);
}

// True when a follow-up's current assignee can no longer actually do
// the work (removed from the workspace, demoted to Viewer, or was never
// reassigned after removal — assigneeId null). The UI surfaces this as
// "needs reassignment" rather than silently completing/deleting the
// follow-up or counting it in an "assigned to an active member" view.
export async function needsReassignment(organizationId: string, assigneeId: string | null): Promise<boolean> {
  if (!assigneeId) return true;
  return !(await isAssigneeEligible(organizationId, assigneeId));
}

// --- Full list for a parent's detail page --------------------------------

export type FollowUpRow = {
  id: string;
  title: string;
  note: string | null;
  dueAt: Date;
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeNeedsReassignment: boolean;
  completedAt: Date | null;
  completedByName: string | null;
  outcomeNote: string | null;
};

function toDisplayName(user: { fullName: string | null; email: string } | null): string | null {
  if (!user) return null;
  return user.fullName || user.email;
}

// All follow-ups (open, completed, cancelled — history is never
// dropped) for one enquiry or proposal, newest-relevant first: open
// items sorted overdue-first/earliest-due (the enum's own declaration
// order — OPEN, COMPLETED, CANCELLED — happens to put open work first,
// and ascending dueAt within that group puts the most-overdue item
// first, since an overdue due date is necessarily the earliest one).
// `assigneeNeedsReassignment` is only computed for OPEN rows — a
// completed/cancelled follow-up is history and shows its assignee as
// recorded, even if that person has since left the workspace.
export async function getFollowUpsForParent(organizationId: string, parent: { enquiryId: string } | { proposalId: string }): Promise<FollowUpRow[]> {
  const prisma = getConstructPrisma();
  const [rows, eligible] = await Promise.all([
    prisma.followUp.findMany({
      where: { organizationId, ...parent },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      include: { assignee: { select: { fullName: true, email: true } }, completedBy: { select: { fullName: true, email: true } } },
    }),
    getEligibleAssignees(organizationId),
  ]);
  const eligibleIds = new Set(eligible.map((a) => a.id));
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    note: row.note,
    dueAt: row.dueAt,
    status: row.status,
    assigneeId: row.assigneeId,
    assigneeName: toDisplayName(row.assignee),
    assigneeNeedsReassignment: row.status === "OPEN" && (!row.assigneeId || !eligibleIds.has(row.assigneeId)),
    completedAt: row.completedAt,
    completedByName: toDisplayName(row.completedBy),
    outcomeNote: row.outcomeNote,
  }));
}

// --- Next open follow-up (for compact list-row indicators) --------------

export async function getNextOpenFollowUp(organizationId: string, parent: { enquiryId: string } | { proposalId: string }) {
  return getConstructPrisma().followUp.findFirst({
    where: { organizationId, status: "OPEN", ...parent },
    orderBy: { dueAt: "asc" },
    select: { id: true, title: true, dueAt: true, assignee: { select: { fullName: true, email: true } } },
  });
}

// Batch version for list pages (enquiries/proposals list) — one query
// instead of N, keyed by parent id.
export async function getNextOpenFollowUpsByEnquiryIds(organizationId: string, enquiryIds: string[]) {
  if (enquiryIds.length === 0) return new Map<string, { id: string; dueAt: Date }>();
  const rows = await getConstructPrisma().followUp.findMany({
    where: { organizationId, status: "OPEN", enquiryId: { in: enquiryIds } },
    orderBy: { dueAt: "asc" },
    select: { id: true, enquiryId: true, dueAt: true },
  });
  const map = new Map<string, { id: string; dueAt: Date }>();
  for (const row of rows) {
    if (!row.enquiryId || map.has(row.enquiryId)) continue; // first row per id wins (already ordered by dueAt asc)
    map.set(row.enquiryId, { id: row.id, dueAt: row.dueAt });
  }
  return map;
}

export async function getNextOpenFollowUpsByProposalIds(organizationId: string, proposalIds: string[]) {
  if (proposalIds.length === 0) return new Map<string, { id: string; dueAt: Date }>();
  const rows = await getConstructPrisma().followUp.findMany({
    where: { organizationId, status: "OPEN", proposalId: { in: proposalIds } },
    orderBy: { dueAt: "asc" },
    select: { id: true, proposalId: true, dueAt: true },
  });
  const map = new Map<string, { id: string; dueAt: Date }>();
  for (const row of rows) {
    if (!row.proposalId || map.has(row.proposalId)) continue;
    map.set(row.proposalId, { id: row.id, dueAt: row.dueAt });
  }
  return map;
}

// --- Overview summary -----------------------------------------------------

export async function getFollowUpOverview(organizationId: string, userId: string, timezone: string) {
  const now = new Date();
  const { startOfTomorrow } = getTodayBoundsInZone(timezone, now);
  const prisma = getConstructPrisma();

  const [overdueCount, dueTodayCount, myNext] = await Promise.all([
    prisma.followUp.count({ where: { organizationId, status: "OPEN", dueAt: { lt: now } } }),
    prisma.followUp.count({ where: { organizationId, status: "OPEN", dueAt: { gte: now, lt: startOfTomorrow } } }),
    prisma.followUp.findMany({
      where: { organizationId, status: "OPEN", assigneeId: userId },
      orderBy: { dueAt: "asc" },
      take: 5,
      select: {
        id: true, title: true, dueAt: true,
        enquiry: { select: { id: true, name: true } },
        proposal: { select: { id: true, reference: true, enquiry: { select: { name: true } } } },
      },
    }),
  ]);

  return { overdueCount, dueTodayCount, myNext };
}

// --- Dashboard list --------------------------------------------------------

export type FollowUpStatusFilter = "OPEN" | "OVERDUE" | "TODAY" | "UPCOMING" | "COMPLETED" | "CANCELLED" | "ALL";

export type FollowUpListFilters = {
  scope: "mine" | "all";
  status: FollowUpStatusFilter;
  parentType?: "ENQUIRY" | "PROPOSAL";
  assigneeId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export async function listFollowUps(organizationId: string, viewerUserId: string, timezone: string, filters: FollowUpListFilters) {
  const now = new Date();
  const { startOfToday, startOfTomorrow } = getTodayBoundsInZone(timezone, now);
  const prisma = getConstructPrisma();

  const where: Prisma.FollowUpWhereInput = {
    organizationId,
    ...(filters.scope === "mine" ? { assigneeId: viewerUserId } : {}),
    ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    ...(filters.parentType === "ENQUIRY" ? { enquiryId: { not: null } } : {}),
    ...(filters.parentType === "PROPOSAL" ? { proposalId: { not: null } } : {}),
  };

  if (filters.status === "OPEN") where.status = "OPEN";
  else if (filters.status === "OVERDUE") { where.status = "OPEN"; where.dueAt = { lt: now }; }
  else if (filters.status === "TODAY") { where.status = "OPEN"; where.dueAt = { gte: startOfToday, lt: startOfTomorrow }; }
  else if (filters.status === "UPCOMING") { where.status = "OPEN"; where.dueAt = { gte: startOfTomorrow }; }
  else if (filters.status === "COMPLETED") where.status = "COMPLETED";
  else if (filters.status === "CANCELLED") where.status = "CANCELLED";

  if (filters.dateFrom || filters.dateTo) {
    where.dueAt = { ...(typeof where.dueAt === "object" ? where.dueAt : {}), ...(filters.dateFrom ? { gte: filters.dateFrom } : {}), ...(filters.dateTo ? { lt: filters.dateTo } : {}) };
  }

  if (filters.search) {
    const search = filters.search;
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { enquiry: { name: { contains: search, mode: "insensitive" } } },
      { proposal: { OR: [{ reference: { contains: search, mode: "insensitive" } }, { enquiry: { name: { contains: search, mode: "insensitive" } } }] } },
    ];
  }

  const rows = await prisma.followUp.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    take: 200,
    include: {
      enquiry: { select: { id: true, name: true } },
      proposal: { select: { id: true, reference: true, enquiry: { select: { name: true } } } },
      assignee: { select: { id: true, fullName: true, email: true } },
    },
  });

  // Sort open work sensibly (overdue first, then earliest due) while
  // leaving completed/cancelled rows after — Prisma's orderBy can't
  // express "OPEN-and-overdue before OPEN-and-not", so it's finished
  // here on the already-narrow (<=200 row) result set.
  return rows.sort((a, b) => {
    const rank = (row: typeof a) => (row.status !== "OPEN" ? 2 : row.dueAt < now ? 0 : 1);
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    return a.dueAt.getTime() - b.dueAt.getTime();
  });
}

export function isFollowUpOverdue(followUp: { status: string; dueAt: Date }, now: Date = new Date()): boolean {
  return followUp.status === "OPEN" && followUp.dueAt < now;
}
