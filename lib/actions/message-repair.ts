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

async function needsMessageRepair() {
  const columns = await prisma.$queryRawUnsafe<SQLiteColumnInfo[]>(
    'PRAGMA table_info("Message")'
  );

  const idColumn = columns.find((column) => column.name === "id");

  if (!idColumn) {
    return true;
  }

  const pkValue = typeof idColumn.pk === "bigint" ? Number(idColumn.pk) : idColumn.pk;

  return !(idColumn.type.toUpperCase() === "INTEGER" && pkValue === 1);
}

async function rebuildMessageTable() {
  await prisma.$executeRawUnsafe('ALTER TABLE "Message" RENAME TO "Message_old"');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Message" (
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
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "Message" (
      "name",
      "email",
      "phone",
      "subject",
      "message",
      "projectInterest",
      "isRead",
      "isReplied",
      "createdAt",
      "updatedAt"
    )
    SELECT
      "name",
      "email",
      "phone",
      "subject",
      "message",
      "projectInterest",
      COALESCE("isRead", 0),
      COALESCE("isReplied", 0),
      COALESCE("createdAt", CURRENT_TIMESTAMP),
      COALESCE("updatedAt", CURRENT_TIMESTAMP)
    FROM "Message_old"
  `);

  await prisma.$executeRawUnsafe('DROP TABLE "Message_old"');
}

export async function ensureMessageTableIsCompatible() {
  if (repairPromise) {
    await repairPromise;
    return;
  }

  repairPromise = (async () => {
    if (!(await needsMessageRepair())) {
      return;
    }

    await rebuildMessageTable();
  })();

  try {
    await repairPromise;
  } finally {
    repairPromise = null;
  }
}
