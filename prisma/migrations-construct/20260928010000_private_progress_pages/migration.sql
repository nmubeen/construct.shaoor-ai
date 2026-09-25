-- Private customer project progress pages: a private construction-
-- delivery project, distinct from a public portfolio Project, with
-- milestones, staff-authored progress updates and photographs, shared
-- with the customer via a private bearer link. Gated behind the
-- PRIVATE_PROJECT_PROGRESS boolean entitlement (read live from the
-- shared control plane's control.plan_entitlements via
-- lib/control/construct-subscription.service.ts's
-- enforceConstructBooleanEntitlement — same mechanism CUSTOM_DOMAIN and
-- PROJECT_PROPOSALS already use; see the companion migration in the
-- shaoor-ai.com repo that seeds the entitlement row).
--
-- Photographs are NOT stored here — this migration only adds metadata
-- rows (storage_path / public_image_url / caption / ordering). The
-- actual private object storage is provisioned separately, see
-- prisma/provision-construct-progress-storage.sql.
--
-- Purely additive: 3 new enums, 5 new tables, no changes to any
-- existing column.

-- CreateEnum
CREATE TYPE "construct"."ProgressLifecycle" AS ENUM ('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "construct"."ProgressMilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "construct"."ProgressUpdateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "construct"."progress_projects" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "location" TEXT,
    "location_customer_visible" BOOLEAN NOT NULL DEFAULT false,
    "customer_summary" TEXT NOT NULL DEFAULT '',
    "internal_notes" TEXT,
    "enquiry_id" UUID,
    "proposal_id" UUID,
    "portfolio_project_id" UUID,
    "planned_start_date" TIMESTAMP(3),
    "target_completion_date" TIMESTAMP(3),
    "lifecycle" "construct"."ProgressLifecycle" NOT NULL DEFAULT 'PLANNED',
    "current_stage" TEXT,
    "next_planned_activity" TEXT,
    "current_revision_number" INTEGER NOT NULL DEFAULT 0,
    "access_token_hash" TEXT,
    "access_expires_at" TIMESTAMP(3),
    "access_created_at" TIMESTAMP(3),
    "access_revoked_at" TIMESTAMP(3),
    "first_opened_at" TIMESTAMP(3),
    "last_opened_at" TIMESTAMP(3),
    "open_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."progress_milestones" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "planned_date" TIMESTAMP(3),
    "status" "construct"."ProgressMilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completed_date" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."progress_updates" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "update_date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "work_completed" TEXT NOT NULL DEFAULT '',
    "work_in_progress" TEXT NOT NULL DEFAULT '',
    "next_planned_activity" TEXT NOT NULL DEFAULT '',
    "issue_note" TEXT,
    "milestone_id" UUID,
    "status" "construct"."ProgressUpdateStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" UUID,
    "published_by_id" UUID,
    "published_at" TIMESTAMP(3),
    "withdrawn_by_id" UUID,
    "withdrawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."progress_photos" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "update_id" UUID NOT NULL,
    "storage_path" TEXT,
    "public_image_url" TEXT,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- Enforces "exactly one photo source" at the database level — same
-- rationale/precedent as follow_ups_exactly_one_parent (Prisma's schema
-- DSL has no XOR/CHECK support). Every server action re-validates this
-- independently regardless.
ALTER TABLE "construct"."progress_photos" ADD CONSTRAINT "progress_photos_exactly_one_source" CHECK (
    ("storage_path" IS NOT NULL AND "public_image_url" IS NULL) OR ("storage_path" IS NULL AND "public_image_url" IS NOT NULL)
);

-- CreateTable
CREATE TABLE "construct"."progress_snapshots" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_by_id" UUID,

    CONSTRAINT "progress_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "progress_projects_access_token_hash_key" ON "construct"."progress_projects"("access_token_hash");

-- CreateIndex
CREATE INDEX "progress_projects_organization_id_lifecycle_updated_at_idx" ON "construct"."progress_projects"("organization_id", "lifecycle", "updated_at");

-- CreateIndex
CREATE INDEX "progress_milestones_organization_id_project_id_sort_order_idx" ON "construct"."progress_milestones"("organization_id", "project_id", "sort_order");

-- CreateIndex
CREATE INDEX "progress_updates_organization_id_project_id_status_update__idx" ON "construct"."progress_updates"("organization_id", "project_id", "status", "update_date");

-- CreateIndex
CREATE INDEX "progress_photos_organization_id_update_id_sort_order_idx" ON "construct"."progress_photos"("organization_id", "update_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "progress_snapshots_project_id_revision_number_key" ON "construct"."progress_snapshots"("project_id", "revision_number");

-- CreateIndex
CREATE INDEX "progress_snapshots_organization_id_project_id_idx" ON "construct"."progress_snapshots"("organization_id", "project_id");

-- AddForeignKey
ALTER TABLE "construct"."progress_projects" ADD CONSTRAINT "progress_projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_projects" ADD CONSTRAINT "progress_projects_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "construct"."contact_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_projects" ADD CONSTRAINT "progress_projects_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "construct"."proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_projects" ADD CONSTRAINT "progress_projects_portfolio_project_id_fkey" FOREIGN KEY ("portfolio_project_id") REFERENCES "construct"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_projects" ADD CONSTRAINT "progress_projects_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_milestones" ADD CONSTRAINT "progress_milestones_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_milestones" ADD CONSTRAINT "progress_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "construct"."progress_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_updates" ADD CONSTRAINT "progress_updates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_updates" ADD CONSTRAINT "progress_updates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "construct"."progress_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_updates" ADD CONSTRAINT "progress_updates_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "construct"."progress_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_updates" ADD CONSTRAINT "progress_updates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_updates" ADD CONSTRAINT "progress_updates_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_updates" ADD CONSTRAINT "progress_updates_withdrawn_by_id_fkey" FOREIGN KEY ("withdrawn_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_photos" ADD CONSTRAINT "progress_photos_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_photos" ADD CONSTRAINT "progress_photos_update_id_fkey" FOREIGN KEY ("update_id") REFERENCES "construct"."progress_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_photos" ADD CONSTRAINT "progress_photos_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_snapshots" ADD CONSTRAINT "progress_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_snapshots" ADD CONSTRAINT "progress_snapshots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "construct"."progress_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."progress_snapshots" ADD CONSTRAINT "progress_snapshots_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
