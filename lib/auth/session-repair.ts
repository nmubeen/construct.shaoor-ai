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

async function needsSessionRepair() {
  const columns = await prisma.$queryRawUnsafe<SQLiteColumnInfo[]>(
    'PRAGMA table_info("Session")'
  );

  const idColumn = columns.find((column) => column.name === "id");

  if (!idColumn) {
    return true;
  }

  const pkValue = typeof idColumn.pk === "bigint" ? Number(idColumn.pk) : idColumn.pk;

  return !(idColumn.type.toUpperCase() === "INTEGER" && pkValue === 1);
}

async function rebuildSessionTable() {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('DROP TABLE IF EXISTS "Session"');

    await tx.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "token" TEXT NOT NULL,
        "expiresAt" DATETIME NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" INTEGER NOT NULL,
        CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await tx.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token")');
  });
}

export async function ensureSessionTableIsCompatible() {
  if (repairPromise) {
    await repairPromise;
    return;
  }

  repairPromise = (async () => {
    if (!(await needsSessionRepair())) {
      return;
    }

    await rebuildSessionTable();
  })();

  try {
    await repairPromise;
  } finally {
    repairPromise = null;
  }
}
