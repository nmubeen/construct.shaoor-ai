-- CreateTable
CREATE TABLE "Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "adminUserId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "Company" ("id", "code", "status", "createdAt", "updatedAt") VALUES (0, 'Shaoor-Build.com', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "recordId" TEXT,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "createdAt", "details", "id", "module", "recordId", "title") SELECT "action", "createdAt", "details", "id", "module", "recordId", "title" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");
CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "website" TEXT,
    "category" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("active", "category", "createdAt", "description", "displayOrder", "featured", "id", "logo", "name", "slug", "updatedAt", "website") SELECT "active", "category", "createdAt", "description", "displayOrder", "featured", "id", "logo", "name", "slug", "updatedAt", "website" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE INDEX "Client_companyId_idx" ON "Client"("companyId");
CREATE UNIQUE INDEX "Client_companyId_slug_key" ON "Client"("companyId", "slug");
CREATE TABLE "new_FAQ" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FAQ_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FAQ" ("active", "answer", "category", "createdAt", "displayOrder", "featured", "id", "question", "updatedAt") SELECT "active", "answer", "category", "createdAt", "displayOrder", "featured", "id", "question", "updatedAt" FROM "FAQ";
DROP TABLE "FAQ";
ALTER TABLE "new_FAQ" RENAME TO "FAQ";
CREATE INDEX "FAQ_companyId_idx" ON "FAQ"("companyId");
CREATE TABLE "new_Gallery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Gallery_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Gallery" ("coverImage", "createdAt", "description", "featured", "id", "isActive", "slug", "sortOrder", "title", "updatedAt") SELECT "coverImage", "createdAt", "description", "featured", "id", "isActive", "slug", "sortOrder", "title", "updatedAt" FROM "Gallery";
DROP TABLE "Gallery";
ALTER TABLE "new_Gallery" RENAME TO "Gallery";
CREATE INDEX "Gallery_companyId_idx" ON "Gallery"("companyId");
CREATE UNIQUE INDEX "Gallery_companyId_slug_key" ON "Gallery"("companyId", "slug");
CREATE TABLE "new_GalleryItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "galleryId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "GalleryItem_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GalleryItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GalleryItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GalleryItem" ("caption", "createdAt", "galleryId", "id", "mediaId", "sortOrder") SELECT "caption", "createdAt", "galleryId", "id", "mediaId", "sortOrder" FROM "GalleryItem";
DROP TABLE "GalleryItem";
ALTER TABLE "new_GalleryItem" RENAME TO "GalleryItem";
CREATE INDEX "GalleryItem_galleryId_idx" ON "GalleryItem"("galleryId");
CREATE INDEX "GalleryItem_companyId_idx" ON "GalleryItem"("companyId");
CREATE TABLE "new_Highlight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Highlight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Highlight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Highlight" ("id", "projectId", "text") SELECT "id", "projectId", "text" FROM "Highlight";
DROP TABLE "Highlight";
ALTER TABLE "new_Highlight" RENAME TO "Highlight";
CREATE INDEX "Highlight_companyId_idx" ON "Highlight"("companyId");
CREATE TABLE "new_Media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "altText" TEXT,
    "title" TEXT,
    "description" TEXT,
    "folder" TEXT,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Media_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Media" ("altText", "createdAt", "description", "extension", "fileName", "fileSize", "folder", "height", "id", "isActive", "mimeType", "originalName", "thumbnailUrl", "title", "type", "updatedAt", "url", "width") SELECT "altText", "createdAt", "description", "extension", "fileName", "fileSize", "folder", "height", "id", "isActive", "mimeType", "originalName", "thumbnailUrl", "title", "type", "updatedAt", "url", "width" FROM "Media";
DROP TABLE "Media";
ALTER TABLE "new_Media" RENAME TO "Media";
CREATE INDEX "Media_companyId_idx" ON "Media"("companyId");
CREATE TABLE "new_Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "projectInterest" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isReplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Message_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("createdAt", "email", "id", "isRead", "isReplied", "message", "name", "phone", "projectInterest", "subject", "updatedAt") SELECT "createdAt", "email", "id", "isRead", "isReplied", "message", "name", "phone", "projectInterest", "subject", "updatedAt" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_companyId_idx" ON "Message"("companyId");
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "coverImage" TEXT,
    "description" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "canonicalUrl" TEXT,
    CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("area", "budget", "canonicalUrl", "category", "client", "coverImage", "createdAt", "description", "duration", "featured", "id", "location", "seoDescription", "seoKeywords", "seoTitle", "slug", "status", "title", "updatedAt", "year") SELECT "area", "budget", "canonicalUrl", "category", "client", "coverImage", "createdAt", "description", "duration", "featured", "id", "location", "seoDescription", "seoKeywords", "seoTitle", "slug", "status", "title", "updatedAt", "year" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");
CREATE UNIQUE INDEX "Project_companyId_slug_key" ON "Project"("companyId", "slug");
CREATE TABLE "new_ProjectGallery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProjectGallery_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectGallery_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProjectGallery" ("id", "image", "projectId") SELECT "id", "image", "projectId" FROM "ProjectGallery";
DROP TABLE "ProjectGallery";
ALTER TABLE "new_ProjectGallery" RENAME TO "ProjectGallery";
CREATE INDEX "ProjectGallery_companyId_idx" ON "ProjectGallery"("companyId");
CREATE TABLE "new_SeoPage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pageKey" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT,
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SeoPage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SeoPage" ("canonicalUrl", "createdAt", "description", "id", "keywords", "ogDescription", "ogImage", "ogTitle", "pageKey", "pageName", "robotsFollow", "robotsIndex", "title", "updatedAt") SELECT "canonicalUrl", "createdAt", "description", "id", "keywords", "ogDescription", "ogImage", "ogTitle", "pageKey", "pageName", "robotsFollow", "robotsIndex", "title", "updatedAt" FROM "SeoPage";
DROP TABLE "SeoPage";
ALTER TABLE "new_SeoPage" RENAME TO "SeoPage";
CREATE INDEX "SeoPage_companyId_idx" ON "SeoPage"("companyId");
CREATE UNIQUE INDEX "SeoPage_companyId_pageKey_key" ON "SeoPage"("companyId", "pageKey");
CREATE TABLE "new_SeoSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteName" TEXT NOT NULL,
    "defaultTitle" TEXT NOT NULL,
    "defaultDescription" TEXT NOT NULL,
    "defaultKeywords" TEXT,
    "siteUrl" TEXT NOT NULL,
    "defaultOgImage" TEXT,
    "favicon" TEXT,
    "appleTouchIcon" TEXT,
    "twitterHandle" TEXT,
    "facebookAppId" TEXT,
    "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "googleVerification" TEXT,
    "bingVerification" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SeoSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SeoSettings" ("appleTouchIcon", "bingVerification", "createdAt", "defaultDescription", "defaultKeywords", "defaultOgImage", "defaultTitle", "facebookAppId", "favicon", "googleVerification", "id", "robotsFollow", "robotsIndex", "siteName", "siteUrl", "twitterHandle", "updatedAt") SELECT "appleTouchIcon", "bingVerification", "createdAt", "defaultDescription", "defaultKeywords", "defaultOgImage", "defaultTitle", "facebookAppId", "favicon", "googleVerification", "id", "robotsFollow", "robotsIndex", "siteName", "siteUrl", "twitterHandle", "updatedAt" FROM "SeoSettings";
DROP TABLE "SeoSettings";
ALTER TABLE "new_SeoSettings" RENAME TO "SeoSettings";
CREATE UNIQUE INDEX "SeoSettings_companyId_key" ON "SeoSettings"("companyId");
CREATE TABLE "new_Service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "canonicalUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Service_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("canonicalUrl", "createdAt", "description", "displayOrder", "icon", "id", "image", "isActive", "seoDescription", "seoKeywords", "seoTitle", "shortDescription", "slug", "title", "updatedAt") SELECT "canonicalUrl", "createdAt", "description", "displayOrder", "icon", "id", "image", "isActive", "seoDescription", "seoKeywords", "seoTitle", "shortDescription", "slug", "title", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE INDEX "Service_companyId_idx" ON "Service"("companyId");
CREATE UNIQUE INDEX "Service_companyId_slug_key" ON "Service"("companyId", "slug");
CREATE TABLE "new_Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("createdAt", "expiresAt", "id", "token", "userId") SELECT "createdAt", "expiresAt", "id", "token", "userId" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_companyId_idx" ON "Session"("companyId");
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logo" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "youtube" TEXT,
    "twitter" TEXT,
    "heroTitle" TEXT NOT NULL,
    "heroSubtitle" TEXT NOT NULL,
    "ctaTitle" TEXT NOT NULL,
    "ctaSubtitle" TEXT NOT NULL,
    "ctaButtonText" TEXT NOT NULL,
    "projectsCompleted" INTEGER NOT NULL DEFAULT 0,
    "clientsServed" INTEGER NOT NULL DEFAULT 0,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "employees" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "seoKeywords" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "heroImage" TEXT,
    "ctaButtonLink" TEXT NOT NULL,
    "whatsApp" TEXT,
    "googleMapsUrl" TEXT,
    "favicon" TEXT,
    "aboutTitle" TEXT,
    "aboutSubtitle" TEXT,
    "aboutStory" TEXT,
    "missionTitle" TEXT,
    "missionDescription" TEXT,
    "visionTitle" TEXT,
    "visionDescription" TEXT,
    "aboutImage" TEXT,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("aboutImage", "aboutStory", "aboutSubtitle", "aboutTitle", "addressLine1", "addressLine2", "city", "clientsServed", "companyName", "country", "createdAt", "ctaButtonLink", "ctaButtonText", "ctaSubtitle", "ctaTitle", "description", "email", "employees", "facebook", "favicon", "googleMapsUrl", "heroImage", "heroSubtitle", "heroTitle", "id", "instagram", "linkedin", "logo", "missionDescription", "missionTitle", "phone", "postalCode", "projectsCompleted", "seoDescription", "seoKeywords", "seoTitle", "state", "tagline", "twitter", "updatedAt", "visionDescription", "visionTitle", "website", "whatsApp", "yearsExperience", "youtube") SELECT "aboutImage", "aboutStory", "aboutSubtitle", "aboutTitle", "addressLine1", "addressLine2", "city", "clientsServed", "companyName", "country", "createdAt", "ctaButtonLink", "ctaButtonText", "ctaSubtitle", "ctaTitle", "description", "email", "employees", "facebook", "favicon", "googleMapsUrl", "heroImage", "heroSubtitle", "heroTitle", "id", "instagram", "linkedin", "logo", "missionDescription", "missionTitle", "phone", "postalCode", "projectsCompleted", "seoDescription", "seoKeywords", "seoTitle", "state", "tagline", "twitter", "updatedAt", "visionDescription", "visionTitle", "website", "whatsApp", "yearsExperience", "youtube" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_companyId_key" ON "Settings"("companyId");
CREATE TABLE "new_TeamMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "shortBio" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "linkedin" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "canonicalUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TeamMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeamMember" ("canonicalUrl", "createdAt", "designation", "displayOrder", "email", "id", "instagram", "isActive", "linkedin", "name", "phone", "photo", "seoDescription", "seoKeywords", "seoTitle", "shortBio", "showOnHomepage", "slug", "twitter", "updatedAt") SELECT "canonicalUrl", "createdAt", "designation", "displayOrder", "email", "id", "instagram", "isActive", "linkedin", "name", "phone", "photo", "seoDescription", "seoKeywords", "seoTitle", "shortBio", "showOnHomepage", "slug", "twitter", "updatedAt" FROM "TeamMember";
DROP TABLE "TeamMember";
ALTER TABLE "new_TeamMember" RENAME TO "TeamMember";
CREATE INDEX "TeamMember_companyId_idx" ON "TeamMember"("companyId");
CREATE UNIQUE INDEX "TeamMember_companyId_slug_key" ON "TeamMember"("companyId", "slug");
CREATE TABLE "new_Testimonial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientName" TEXT NOT NULL,
    "company" TEXT,
    "designation" TEXT,
    "photo" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "testimonial" TEXT NOT NULL,
    "projectName" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Testimonial_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Testimonial" ("active", "clientName", "company", "createdAt", "designation", "displayOrder", "featured", "id", "photo", "projectName", "rating", "testimonial", "updatedAt") SELECT "active", "clientName", "company", "createdAt", "designation", "displayOrder", "featured", "id", "photo", "projectName", "rating", "testimonial", "updatedAt" FROM "Testimonial";
DROP TABLE "Testimonial";
ALTER TABLE "new_Testimonial" RENAME TO "Testimonial";
CREATE INDEX "Testimonial_companyId_idx" ON "Testimonial"("companyId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "passwordHash", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE INDEX "User_companyId_idx" ON "User"("companyId");
CREATE UNIQUE INDEX "User_companyId_email_key" ON "User"("companyId", "email");
UPDATE "Company" SET "adminUserId" = (SELECT "id" FROM "User" WHERE "companyId" = 0 ORDER BY "id" LIMIT 1) WHERE "id" = 0;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Company_adminUserId_key" ON "Company"("adminUserId");
