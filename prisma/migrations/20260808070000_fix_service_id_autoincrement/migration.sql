-- The original Service migration created id as TEXT even though the current
-- Prisma model uses an auto-incrementing integer. SQLite only generates an id
-- automatically for an INTEGER PRIMARY KEY, so rebuild the table accordingly.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

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
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Service" (
    "title",
    "slug",
    "shortDescription",
    "description",
    "image",
    "icon",
    "displayOrder",
    "isActive",
    "seoTitle",
    "seoDescription",
    "seoKeywords",
    "canonicalUrl",
    "createdAt",
    "updatedAt"
)
SELECT
    "title",
    "slug",
    "shortDescription",
    "description",
    "image",
    "icon",
    "displayOrder",
    "isActive",
    "seoTitle",
    "seoDescription",
    "seoKeywords",
    "canonicalUrl",
    "createdAt",
    "updatedAt"
FROM "Service"
ORDER BY rowid;

DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
