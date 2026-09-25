-- Follow-up reminders: an internal task attached to exactly one parent
-- (an enquiry or a proposal) reminding staff of the next action to take.
-- Purely in-app — no email/SMS/push is ever sent. Plan eligibility is
-- inherited from the parent record, not a new entitlement (see
-- lib/services/construct-followup.service.ts) — no new row is needed in
-- the shared control plane's control.plan_entitlements for this feature.
--
-- Purely additive: 1 new column on organizations, 1 new enum, 1 new
-- table, no changes to any other existing column.

-- AlterTable: organization-level IANA timezone, used for every
-- date/time boundary this feature computes (due-date entry, "today" /
-- overdue cutoffs, date shortcuts, list labels) — see
-- lib/followups/timezone.ts. Defaulted to "Asia/Kolkata" (this
-- product's primary market) rather than silently using server-local
-- time; existing rows get this default via the ALTER itself.
ALTER TABLE "construct"."organizations" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- CreateEnum
CREATE TYPE "construct"."FollowUpStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "construct"."follow_ups" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "enquiry_id" UUID,
    "proposal_id" UUID,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "due_at" TIMESTAMP(3) NOT NULL,
    "assignee_id" UUID,
    "status" "construct"."FollowUpStatus" NOT NULL DEFAULT 'OPEN',
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "completed_by_id" UUID,
    "outcome_note" TEXT,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- Enforces "exactly one parent" at the database level — Prisma's schema
-- DSL has no XOR/CHECK support, hence raw SQL (same "raw SQL for what
-- the DSL can't express" precedent as the proposals migration's partial
-- unique index). Every server action re-validates this independently
-- regardless; this is the backstop, not the only guard.
ALTER TABLE "construct"."follow_ups" ADD CONSTRAINT "follow_ups_exactly_one_parent" CHECK (
    ("enquiry_id" IS NOT NULL AND "proposal_id" IS NULL) OR ("enquiry_id" IS NULL AND "proposal_id" IS NOT NULL)
);

-- CreateIndex
CREATE INDEX "follow_ups_organization_id_status_due_at_idx" ON "construct"."follow_ups"("organization_id", "status", "due_at");

-- CreateIndex
CREATE INDEX "follow_ups_organization_id_enquiry_id_idx" ON "construct"."follow_ups"("organization_id", "enquiry_id");

-- CreateIndex
CREATE INDEX "follow_ups_organization_id_proposal_id_idx" ON "construct"."follow_ups"("organization_id", "proposal_id");

-- CreateIndex
CREATE INDEX "follow_ups_organization_id_assignee_id_status_due_at_idx" ON "construct"."follow_ups"("organization_id", "assignee_id", "status", "due_at");

-- AddForeignKey
ALTER TABLE "construct"."follow_ups" ADD CONSTRAINT "follow_ups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."follow_ups" ADD CONSTRAINT "follow_ups_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "construct"."contact_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."follow_ups" ADD CONSTRAINT "follow_ups_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "construct"."proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."follow_ups" ADD CONSTRAINT "follow_ups_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."follow_ups" ADD CONSTRAINT "follow_ups_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."follow_ups" ADD CONSTRAINT "follow_ups_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
