-- Testimonial was also created with a text primary key before its Prisma model
-- changed to an auto-incrementing integer.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

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
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Testimonial" (
    "clientName", "company", "designation", "photo", "rating",
    "testimonial", "projectName", "featured", "active", "displayOrder",
    "createdAt", "updatedAt"
)
SELECT
    "clientName", "company", "designation", "photo", "rating",
    "testimonial", "projectName", "featured", "active", "displayOrder",
    "createdAt", "updatedAt"
FROM "Testimonial"
ORDER BY rowid;

DROP TABLE "Testimonial";
ALTER TABLE "new_Testimonial" RENAME TO "Testimonial";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
