-- FAQ was originally created with a text primary key before its Prisma model
-- changed to an auto-incrementing integer.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_FAQ" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_FAQ" (
    "question", "answer", "category", "displayOrder", "featured",
    "active", "createdAt", "updatedAt"
)
SELECT
    "question", "answer", "category", "displayOrder", "featured",
    "active", "createdAt", "updatedAt"
FROM "FAQ"
ORDER BY rowid;

DROP TABLE "FAQ";
ALTER TABLE "new_FAQ" RENAME TO "FAQ";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
