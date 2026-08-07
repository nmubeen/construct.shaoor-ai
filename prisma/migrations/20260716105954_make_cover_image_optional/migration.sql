-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "coverImage" TEXT,
    "description" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "canonicalUrl" TEXT
);
INSERT INTO "new_Project" ("area", "budget", "canonicalUrl", "category", "client", "coverImage", "createdAt", "description", "duration", "featured", "id", "location", "seoDescription", "seoKeywords", "seoTitle", "slug", "status", "title", "updatedAt", "year") SELECT "area", "budget", "canonicalUrl", "category", "client", "coverImage", "createdAt", "description", "duration", "featured", "id", "location", "seoDescription", "seoKeywords", "seoTitle", "slug", "status", "title", "updatedAt", "year" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
