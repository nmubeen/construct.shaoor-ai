"use server";

import { prisma } from "@/lib/prisma";

type SQLiteColumnInfo = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number | bigint;
};

let repairPromise: Promise<void> | null = null;

async function needsClientRepair() {
  const columns = await prisma.$queryRawUnsafe<SQLiteColumnInfo[]>(
    'PRAGMA table_info("Client")'
  );

  const idColumn = columns.find((column) => column.name === "id");

  if (!idColumn) {
    return true;
  }

  const pkValue = typeof idColumn.pk === "bigint" ? Number(idColumn.pk) : idColumn.pk;

  return !(idColumn.type.toUpperCase() === "INTEGER" && pkValue === 1);
}

async function rebuildClientTable() {
  await prisma.$executeRawUnsafe('ALTER TABLE "Client" RENAME TO "Client_old"');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Client" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "logo" TEXT,
      "website" TEXT,
      "category" TEXT,
      "description" TEXT,
      "displayOrder" INTEGER NOT NULL DEFAULT 0,
      "featured" BOOLEAN NOT NULL DEFAULT false,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "Client" (
      "name",
      "slug",
      "logo",
      "website",
      "category",
      "description",
      "displayOrder",
      "featured",
      "active",
      "createdAt",
      "updatedAt"
    )
    SELECT
      "name",
      "slug",
      "logo",
      "website",
      "category",
      "description",
      COALESCE("displayOrder", 0),
      COALESCE("featured", 0),
      COALESCE("active", 1),
      COALESCE("createdAt", CURRENT_TIMESTAMP),
      COALESCE("updatedAt", CURRENT_TIMESTAMP)
    FROM "Client_old"
  `);

  await prisma.$executeRawUnsafe('DROP TABLE "Client_old"');
}

export async function ensureClientTableIsCompatible() {
  if (repairPromise) {
    await repairPromise;
    return;
  }

  repairPromise = (async () => {
    if (!(await needsClientRepair())) {
      return;
    }

    await rebuildClientTable();
  })();

  try {
    await repairPromise;
  } finally {
    repairPromise = null;
  }
}
