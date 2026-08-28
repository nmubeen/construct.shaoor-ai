-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "construct";

-- CreateEnum
CREATE TYPE "construct"."OrganizationStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "construct"."MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "construct"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "construct"."DomainStatus" AS ENUM ('PENDING', 'VERIFYING', 'ACTIVE', 'FAILED', 'REMOVED');

-- CreateEnum
CREATE TYPE "construct"."PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "construct"."MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "construct"."MessageStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "construct"."organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "construct"."OrganizationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."memberships" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "construct"."MembershipRole" NOT NULL DEFAULT 'EDITOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."invitations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "construct"."MembershipRole" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "construct"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invited_by_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."domains" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "hostname" TEXT NOT NULL,
    "status" "construct"."DomainStatus" NOT NULL DEFAULT 'PENDING',
    "verification_token" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."site_publications" (
    "organization_id" UUID NOT NULL,
    "status" "construct"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "published_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_publications_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "construct"."site_settings" (
    "organization_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "postal_code" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "youtube" TEXT,
    "twitter" TEXT,
    "hero_title" TEXT NOT NULL,
    "hero_subtitle" TEXT NOT NULL,
    "hero_image_url" TEXT,
    "cta_title" TEXT NOT NULL,
    "cta_subtitle" TEXT NOT NULL,
    "cta_button_text" TEXT NOT NULL,
    "cta_button_link" TEXT NOT NULL,
    "projects_completed" INTEGER NOT NULL DEFAULT 0,
    "clients_served" INTEGER NOT NULL DEFAULT 0,
    "years_experience" INTEGER NOT NULL DEFAULT 0,
    "employees" INTEGER NOT NULL DEFAULT 0,
    "whats_app" TEXT,
    "google_maps_url" TEXT,
    "about_title" TEXT,
    "about_subtitle" TEXT,
    "about_story" TEXT,
    "mission_title" TEXT,
    "mission_description" TEXT,
    "vision_title" TEXT,
    "vision_description" TEXT,
    "about_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "construct"."projects" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "description" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "canonical_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."project_highlights" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."project_gallery_items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."media" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "alt_text" TEXT,
    "title" TEXT,
    "description" TEXT,
    "folder" TEXT,
    "mime_type" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "type" "construct"."MediaType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."galleries" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "cover_image_url" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."gallery_items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "gallery_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."services" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT,
    "icon" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "canonical_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."team_members" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "short_bio" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "linkedin" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "show_on_homepage" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "canonical_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."clients" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "website" TEXT,
    "category" TEXT,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."testimonials" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "client_name" TEXT NOT NULL,
    "company" TEXT,
    "designation" TEXT,
    "photo_url" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "testimonial" TEXT NOT NULL,
    "project_name" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."faqs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."contact_messages" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "project_interest" TEXT,
    "status" "construct"."MessageStatus" NOT NULL DEFAULT 'NEW',
    "consent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."seo_settings" (
    "organization_id" UUID NOT NULL,
    "site_name" TEXT NOT NULL,
    "default_title" TEXT NOT NULL,
    "default_description" TEXT NOT NULL,
    "default_keywords" TEXT,
    "site_url" TEXT NOT NULL,
    "default_og_image_url" TEXT,
    "favicon_url" TEXT,
    "apple_touch_icon_url" TEXT,
    "twitter_handle" TEXT,
    "facebook_app_id" TEXT,
    "robots_index" BOOLEAN NOT NULL DEFAULT true,
    "robots_follow" BOOLEAN NOT NULL DEFAULT true,
    "google_verification" TEXT,
    "bing_verification" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "construct"."seo_pages" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "page_key" TEXT NOT NULL,
    "page_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT,
    "canonical_url" TEXT,
    "og_title" TEXT,
    "og_description" TEXT,
    "og_image_url" TEXT,
    "robots_index" BOOLEAN NOT NULL DEFAULT true,
    "robots_follow" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."navigation_items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "open_in_new_tab" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construct"."audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "record_id" TEXT,
    "title" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "construct"."organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "construct"."users"("email");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "construct"."memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_organization_id_user_id_key" ON "construct"."memberships"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "construct"."invitations"("token_hash");

-- CreateIndex
CREATE INDEX "invitations_organization_id_status_idx" ON "construct"."invitations"("organization_id", "status");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "construct"."invitations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "domains_hostname_key" ON "construct"."domains"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "domains_verification_token_key" ON "construct"."domains"("verification_token");

-- CreateIndex
CREATE INDEX "domains_organization_id_status_idx" ON "construct"."domains"("organization_id", "status");

-- CreateIndex
CREATE INDEX "projects_organization_id_status_idx" ON "construct"."projects"("organization_id", "status");

-- CreateIndex
CREATE INDEX "projects_organization_id_featured_idx" ON "construct"."projects"("organization_id", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "projects_organization_id_slug_key" ON "construct"."projects"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "project_highlights_organization_id_project_id_idx" ON "construct"."project_highlights"("organization_id", "project_id");

-- CreateIndex
CREATE INDEX "project_gallery_items_organization_id_project_id_idx" ON "construct"."project_gallery_items"("organization_id", "project_id");

-- CreateIndex
CREATE INDEX "media_organization_id_folder_idx" ON "construct"."media"("organization_id", "folder");

-- CreateIndex
CREATE UNIQUE INDEX "media_organization_id_storage_path_key" ON "construct"."media"("organization_id", "storage_path");

-- CreateIndex
CREATE INDEX "galleries_organization_id_is_active_idx" ON "construct"."galleries"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "galleries_organization_id_slug_key" ON "construct"."galleries"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "gallery_items_organization_id_gallery_id_idx" ON "construct"."gallery_items"("organization_id", "gallery_id");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_items_gallery_id_media_id_key" ON "construct"."gallery_items"("gallery_id", "media_id");

-- CreateIndex
CREATE INDEX "services_organization_id_is_active_idx" ON "construct"."services"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "services_organization_id_slug_key" ON "construct"."services"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "team_members_organization_id_is_active_idx" ON "construct"."team_members"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_organization_id_slug_key" ON "construct"."team_members"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "clients_organization_id_is_active_idx" ON "construct"."clients"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "clients_organization_id_slug_key" ON "construct"."clients"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "testimonials_organization_id_is_active_idx" ON "construct"."testimonials"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "faqs_organization_id_is_active_idx" ON "construct"."faqs"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "contact_messages_organization_id_status_created_at_idx" ON "construct"."contact_messages"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "seo_pages_organization_id_page_key_key" ON "construct"."seo_pages"("organization_id", "page_key");

-- CreateIndex
CREATE INDEX "navigation_items_organization_id_display_order_idx" ON "construct"."navigation_items"("organization_id", "display_order");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "construct"."audit_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_module_idx" ON "construct"."audit_logs"("organization_id", "module");

-- AddForeignKey
ALTER TABLE "construct"."memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "construct"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."invitations" ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."invitations" ADD CONSTRAINT "invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "construct"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."domains" ADD CONSTRAINT "domains_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."site_publications" ADD CONSTRAINT "site_publications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."site_publications" ADD CONSTRAINT "site_publications_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."site_settings" ADD CONSTRAINT "site_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."project_highlights" ADD CONSTRAINT "project_highlights_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "construct"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."project_gallery_items" ADD CONSTRAINT "project_gallery_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "construct"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."media" ADD CONSTRAINT "media_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."galleries" ADD CONSTRAINT "galleries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."gallery_items" ADD CONSTRAINT "gallery_items_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "construct"."galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."gallery_items" ADD CONSTRAINT "gallery_items_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "construct"."media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."services" ADD CONSTRAINT "services_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."team_members" ADD CONSTRAINT "team_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."clients" ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."testimonials" ADD CONSTRAINT "testimonials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."faqs" ADD CONSTRAINT "faqs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."contact_messages" ADD CONSTRAINT "contact_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."seo_settings" ADD CONSTRAINT "seo_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."seo_pages" ADD CONSTRAINT "seo_pages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."navigation_items" ADD CONSTRAINT "navigation_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "construct"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construct"."audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "construct"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
