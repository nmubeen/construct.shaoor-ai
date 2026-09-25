import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/construct-client";

import {
  getFollowUpOverview,
  getNextOpenFollowUp,
  isFollowUpOverdue,
  listFollowUps,
} from "@/lib/services/construct-followup.service";
import { getTodayBoundsInZone } from "@/lib/followups/timezone";
import { createTestEnquiry, createTestFollowUp, createTestMembership, createTestOrganization, createTestUser, testPrisma } from "./fixtures";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe("follow-up list filters, overview counts and overdue derivation", () => {
  let prisma: PrismaClient;
  let organizationId: string;
  let enquiryId: string;
  let userId: string;
  let overdueId: string, dueTodayId: string, upcomingId: string, completedId: string, cancelledId: string;

  beforeAll(async () => {
    prisma = testPrisma();
    const org = await createTestOrganization(prisma, "Followup List Test", { timezone: "Asia/Kolkata" });
    organizationId = org.id;
    const enquiry = await createTestEnquiry(prisma, organizationId);
    enquiryId = enquiry.id;
    const user = await createTestUser(prisma, "List Test User");
    userId = user.id;
    await createTestMembership(prisma, organizationId, userId, "EDITOR", "ACTIVE");

    const now = new Date();
    // "Due today" must land strictly between now and the end of today in
    // the org's own timezone (Asia/Kolkata) — a fixed "+1 hour" offset
    // can cross into tomorrow whenever the test happens to run within an
    // hour of IST midnight, which is exactly the kind of boundary bug
    // this feature's own DST/timezone tests exist to catch. Clamp to
    // whichever is earlier: +1 hour, or 1 minute before midnight.
    const { startOfTomorrow } = getTodayBoundsInZone("Asia/Kolkata", now);
    const dueTodayAt = new Date(Math.min(now.getTime() + HOUR, startOfTomorrow.getTime() - 60_000));
    const overdue = await createTestFollowUp(prisma, organizationId, { enquiryId }, { title: "Overdue task", dueAt: new Date(now.getTime() - 2 * DAY), status: "OPEN", assigneeId: userId });
    const dueToday = await createTestFollowUp(prisma, organizationId, { enquiryId }, { title: "Due today task", dueAt: dueTodayAt, status: "OPEN", assigneeId: userId });
    const upcoming = await createTestFollowUp(prisma, organizationId, { enquiryId }, { title: "Upcoming task", dueAt: new Date(now.getTime() + 10 * DAY), status: "OPEN", assigneeId: userId });
    const completed = await createTestFollowUp(prisma, organizationId, { enquiryId }, { title: "Completed task", dueAt: new Date(now.getTime() - 3 * DAY), status: "COMPLETED", assigneeId: userId });
    const cancelled = await createTestFollowUp(prisma, organizationId, { enquiryId }, { title: "Cancelled task", dueAt: new Date(now.getTime() + 3 * DAY), status: "CANCELLED", assigneeId: userId });
    overdueId = overdue.id; dueTodayId = dueToday.id; upcomingId = upcoming.id; completedId = completed.id; cancelledId = cancelled.id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  it("isFollowUpOverdue: only OPEN + past due counts as overdue", () => {
    expect(isFollowUpOverdue({ status: "OPEN", dueAt: new Date(Date.now() - 1000) })).toBe(true);
    expect(isFollowUpOverdue({ status: "OPEN", dueAt: new Date(Date.now() + 1000) })).toBe(false);
    expect(isFollowUpOverdue({ status: "COMPLETED", dueAt: new Date(Date.now() - 1000) })).toBe(false);
    expect(isFollowUpOverdue({ status: "CANCELLED", dueAt: new Date(Date.now() - 1000) })).toBe(false);
  });

  it("listFollowUps status=OVERDUE returns only the overdue OPEN item", async () => {
    const rows = await listFollowUps(organizationId, userId, "Asia/Kolkata", { scope: "all", status: "OVERDUE" });
    expect(rows.map((r) => r.id)).toEqual([overdueId]);
  });

  it("listFollowUps status=TODAY returns the item due within today's org-local window", async () => {
    const rows = await listFollowUps(organizationId, userId, "Asia/Kolkata", { scope: "all", status: "TODAY" });
    expect(rows.map((r) => r.id)).toEqual([dueTodayId]);
  });

  it("listFollowUps status=UPCOMING returns only future-dated OPEN items beyond today", async () => {
    const rows = await listFollowUps(organizationId, userId, "Asia/Kolkata", { scope: "all", status: "UPCOMING" });
    expect(rows.map((r) => r.id)).toEqual([upcomingId]);
  });

  it("listFollowUps status=COMPLETED / CANCELLED isolate their own buckets", async () => {
    const completedRows = await listFollowUps(organizationId, userId, "Asia/Kolkata", { scope: "all", status: "COMPLETED" });
    expect(completedRows.map((r) => r.id)).toEqual([completedId]);
    const cancelledRows = await listFollowUps(organizationId, userId, "Asia/Kolkata", { scope: "all", status: "CANCELLED" });
    expect(cancelledRows.map((r) => r.id)).toEqual([cancelledId]);
  });

  it("listFollowUps status=OPEN sorts overdue first, then earliest due (overdue < due-today < upcoming)", async () => {
    const rows = await listFollowUps(organizationId, userId, "Asia/Kolkata", { scope: "all", status: "OPEN" });
    expect(rows.map((r) => r.id)).toEqual([overdueId, dueTodayId, upcomingId]);
  });

  it("listFollowUps scope=mine only returns rows assigned to the viewer", async () => {
    const otherUser = await createTestUser(prisma, "Unrelated User");
    await createTestMembership(prisma, organizationId, otherUser.id, "EDITOR", "ACTIVE");
    const rows = await listFollowUps(organizationId, otherUser.id, "Asia/Kolkata", { scope: "mine", status: "OPEN" });
    expect(rows).toHaveLength(0);
  });

  it("getFollowUpOverview reports the overdue and due-today counts and the viewer's next open items", async () => {
    const overview = await getFollowUpOverview(organizationId, userId, "Asia/Kolkata");
    expect(overview.overdueCount).toBe(1);
    expect(overview.dueTodayCount).toBe(1);
    expect(overview.myNext.map((f) => f.id)).toContain(overdueId);
  });

  it("getNextOpenFollowUp for the enquiry returns the earliest-due OPEN item (the overdue one)", async () => {
    const next = await getNextOpenFollowUp(organizationId, { enquiryId });
    expect(next?.id).toBe(overdueId);
  });
});
