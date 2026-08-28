-- Media, Gallery, and GalleryItem were created with text primary keys before
-- their Prisma models changed to auto-incrementing integers. Temporary maps
-- preserve GalleryItem relationships while the IDs are reassigned.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TEMP TABLE "MediaIdMap" (
    "oldId" TEXT NOT NULL PRIMARY KEY,
    "newId" INTEGER NOT NULL UNIQUE
);
INSERT INTO "MediaIdMap" ("oldId", "newId")
SELECT "id", ROW_NUMBER() OVER (ORDER BY rowid) FROM "Media";

CREATE TEMP TABLE "GalleryIdMap" (
    "oldId" TEXT NOT NULL PRIMARY KEY,
    "newId" INTEGER NOT NULL UNIQUE
);
INSERT INTO "GalleryIdMap" ("oldId", "newId")
SELECT "id", ROW_NUMBER() OVER (ORDER BY rowid) FROM "Gallery";

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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Media" (
    "id", "fileName", "originalName", "altText", "title", "description",
    "folder", "mimeType", "extension", "fileSize", "width", "height",
    "type", "url", "thumbnailUrl", "isActive", "createdAt", "updatedAt"
)
SELECT
    map."newId", media."fileName", media."originalName", media."altText",
    media."title", media."description", media."folder", media."mimeType",
    media."extension", media."fileSize", media."width", media."height",
    media."type", media."url", media."thumbnailUrl", media."isActive",
    media."createdAt", media."updatedAt"
FROM "Media" AS media
JOIN "MediaIdMap" AS map ON map."oldId" = media."id";

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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Gallery" (
    "id", "title", "slug", "description", "coverImage", "featured",
    "isActive", "sortOrder", "createdAt", "updatedAt"
)
SELECT
    map."newId", gallery."title", gallery."slug", gallery."description",
    gallery."coverImage", gallery."featured", gallery."isActive",
    gallery."sortOrder", gallery."createdAt", gallery."updatedAt"
FROM "Gallery" AS gallery
JOIN "GalleryIdMap" AS map ON map."oldId" = gallery."id";

CREATE TABLE "new_GalleryItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "galleryId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryItem_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GalleryItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GalleryItem" (
    "galleryId", "mediaId", "caption", "sortOrder", "createdAt"
)
SELECT
    galleryMap."newId", mediaMap."newId", item."caption",
    item."sortOrder", item."createdAt"
FROM "GalleryItem" AS item
JOIN "GalleryIdMap" AS galleryMap ON galleryMap."oldId" = item."galleryId"
JOIN "MediaIdMap" AS mediaMap ON mediaMap."oldId" = item."mediaId"
ORDER BY item.rowid;

DROP TABLE "GalleryItem";
DROP TABLE "Gallery";
DROP TABLE "Media";

ALTER TABLE "new_Media" RENAME TO "Media";
ALTER TABLE "new_Gallery" RENAME TO "Gallery";
ALTER TABLE "new_GalleryItem" RENAME TO "GalleryItem";

CREATE UNIQUE INDEX "Gallery_slug_key" ON "Gallery"("slug");
CREATE INDEX "GalleryItem_galleryId_idx" ON "GalleryItem"("galleryId");

DROP TABLE "MediaIdMap";
DROP TABLE "GalleryIdMap";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
