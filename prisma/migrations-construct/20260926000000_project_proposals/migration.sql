-- Project Proposals: turn an existing enquiry into a personalised,
-- branded proposal shared with the customer via a private, unguessable
-- link. Gated behind the PROJECT_PROPOSALS boolean entitlement (read
-- live from the shared control plane's control.plan_entitlements via
-- lib/control/construct-subscription.service.ts's
-- enforceConstructBooleanEntitlement — same mechanism CUSTOM_DOMAIN
-- already uses, so no schema change needed there; see the companion
-- migration in the shaoor-ai.com repo that seeds the entitlement row).
--
-- Purely additive: 3 new enums, 5 new tables, no changes to any
-- existing column.

-- CreateEnum
CREATE TYPE "construct"."ProposalStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REVOKED');

-- CreateEnum
CREATE TYPE "construct"."ProposalPriceMode" AS ENUM ('DISCUSS', 'FIXED', 'RANGE');

-- CreateEnum
CREATE TYPE "construct"."ProposalResponseType" AS ENUM ('DISCUSS', 'SITE_VISIT');

-- CreateTable
CREATE TABLE "construct"."proposals" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "enquiry_id" UUID NOT NULL,
    "status" "construct"."ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "introduction" TEXT NOT NULL DEFAULT '',
    "requirements_summary" TEXT NOT NULL DEFAULT '',
    "scope_of_work" TEXT NOT NULL DEFAULT '',
    "exclusions" TEXT NOT NULL DEFAULT '',
    "assumptions" TEXT NOT NULL DEFAULT '',
    "closing_message" TEXT NOT NULL DEFAULT '',
    "indicative_timeline" TEXT,
    "price_mode" "construct"."ProposalPriceMode" NOT NULL DEFAULT 'DISCUSS',
    "price_currency" TEXT NOT NULL DEFAULT 'INR',
    "price_amount_minor" INTEGER,
    "price_min_amount_minor" INTEGER,
    "price_max_amount_minor" INTEGER,
    "pricing_basis" TEXT,
    "tax_note" TEXT,
    "internal_notes" TEXT,
    "expires_at" TIMESTAMP(3),
    "token" TEXT NOT NULL,
    "current_revision_number" INTEGER NOT NULL DEFAULT 0,
    "first_opened_at" TIMESTAMP(3),
    "last_opened_at" TIMESTAMP(3),
    "open_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID,
    "published_by_id" UUID,
    "approved_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."proposal_revisions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_by_id" UUID,

    CONSTRAINT "proposal_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."proposal_portfolio_items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "reason" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "proposal_portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."proposal_testimonial_items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "testimonial_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "proposal_testimonial_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."proposal_responses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "type" "construct"."ProposalResponseType" NOT NULL,
    "message" TEXT,
    "preferred_date" TIMESTAMP(3),
    "preferred_time" TEXT,
    "requester_ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proposals_token_key" ON "construct"."proposals"("token");

-- CreateIndex
CREATE INDEX "proposals_organization_id_status_updated_at_idx" ON "construct"."proposals"("organization_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "proposals_organization_id_enquiry_id_idx" ON "construct"."proposals"("organization_id", "enquiry_id");

-- Enforces "at most one open draft per enquiry" at the database level —
-- Prisma's schema DSL has no WHERE clause on @@unique, hence raw SQL.
-- A double-click or a retried create request hits this constraint
-- instead of creating a duplicate draft; the server action catches the
-- violation and reuses the existing draft (see
-- createConstructProposalFromEnquiryAction).
CREATE UNIQUE INDEX "proposals_one_open_draft_per_enquiry" ON "construct"."proposals"("organization_id", "enquiry_id") WHERE "status" = 'DRAFT';

-- CreateIndex
CREATE INDEX "proposal_revisions_organization_id_proposal_id_idx" ON "construct"."proposal_revisions"("organization_id", "proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_revisions_proposal_id_revision_number_key" ON "construct"."proposal_revisions"("proposal_id", "revision_number");

-- CreateIndex
CREATE INDEX "proposal_portfolio_items_organization_id_proposal_id_idx" ON "construct"."proposal_portfolio_items"("organization_id", "proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_portfolio_items_proposal_id_project_id_key" ON "construct"."proposal_portfolio_items"("proposal_id", "project_id");

-- CreateIndex
CREATE INDEX "proposal_testimonial_items_organization_id_proposal_id_idx" ON "construct"."proposal_testimonial_items"("organization_id", "proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_testimonial_items_proposal_id_testimonial_id_key" ON "construct"."proposal_testimonial_items"("proposal_id", "testimonial_id");

-- CreateIndex
CREATE INDEX "proposal_responses_organization_id_proposal_id_idx" ON "construct"."proposal_responses"("organization_id", "proposal_id");

-- AddForeignKey
ALTER TABLE "construct"."proposals" ADD CONSTRAINT "proposals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposals" ADD CONSTRAINT "proposals_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "construct"."contact_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposals" ADD CONSTRAINT "proposals_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposals" ADD CONSTRAINT "proposals_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposal_revisions" ADD CONSTRAINT "proposal_revisions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposal_revisions" ADD CONSTRAINT "proposal_revisions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "construct"."proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposal_revisions" ADD CONSTRAINT "proposal_revisions_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposal_portfolio_items" ADD CONSTRAINT "proposal_portfolio_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposal_portfolio_items" ADD CONSTRAINT "proposal_portfolio_items_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "construct"."proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposal_portfolio_items" ADD CONSTRAINT "proposal_portfolio_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "construct"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposal_testimonial_items" ADD CONSTRAINT "proposal_testimonial_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposal_testimonial_items" ADD CONSTRAINT "proposal_testimonial_items_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "construct"."proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposal_testimonial_items" ADD CONSTRAINT "proposal_testimonial_items_testimonial_id_fkey" FOREIGN KEY ("testimonial_id") REFERENCES "construct"."testimonials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposal_responses" ADD CONSTRAINT "proposal_responses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."proposal_responses" ADD CONSTRAINT "proposal_responses_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "construct"."proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
