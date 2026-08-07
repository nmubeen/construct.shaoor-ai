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

async function needsAuditLogRepair() {
  const columns = await prisma.$queryRawUnsafe<SQLiteColumnInfo[]>(
    'PRAGMA table_info("AuditLog")'
  );

  const idColumn = columns.find((column) => column.name === "id");

  if (!idColumn) {
    return true;
  }

  const pkValue = typeof idColumn.pk === "bigint" ? Number(idColumn.pk) : idColumn.pk;

  return !(idColumn.type.toUpperCase() === "INTEGER" && pkValue === 1);
}

async function rebuildAuditLogTable() {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('DROP TABLE IF EXISTS "AuditLog"');

    await tx.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "module" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "recordId" TEXT,
        "title" TEXT NOT NULL,
        "details" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await tx.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "AuditLog_module_idx" ON "AuditLog"("module")');
    await tx.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")');
  });
}

export async function ensureAuditLogTableIsCompatible() {
  if (repairPromise) {
    await repairPromise;
    return;
  }

  repairPromise = (async () => {
    if (!(await needsAuditLogRepair())) {
      return;
    }

    await rebuildAuditLogTable();
  })();

  try {
    await repairPromise;
  } finally {
    repairPromise = null;
  }
}
