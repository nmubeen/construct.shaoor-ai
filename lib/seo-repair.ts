import { prisma } from "@/lib/prisma";

type RawIdRow = {
  id: unknown;
};

type SQLiteColumnInfo = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number | bigint;
};

let repairPromise: Promise<void> | null = null;

async function hasLegacyStringId(tableName: "SeoSettings" | "SeoPage") {
  const columns = await prisma.$queryRawUnsafe<SQLiteColumnInfo[]>(
    `PRAGMA table_info("${tableName}")`
  );

  const idColumn = columns.find((column) => column.name === "id");

  if (!idColumn) {
    return true;
  }

  const pkValue = typeof idColumn.pk === "bigint" ? Number(idColumn.pk) : idColumn.pk;

  const isIntegerPrimaryKey = idColumn.type.toUpperCase() === "INTEGER" && pkValue === 1;

  if (!isIntegerPrimaryKey) {
    return true;
  }

  const rows = await prisma.$queryRawUnsafe<RawIdRow[]>(
    `SELECT id FROM "${tableName}" ORDER BY "createdAt" ASC LIMIT 1`
  );

  return typeof rows[0]?.id === "string";
}

async function rebuildSeoTables() {
  await prisma.$transaction(async (tx) => {
    // Rebuild both SEO tables atomically so concurrent prerender workers never
    // observe a partial schema (e.g., SeoSettings exists while SeoPage is missing).
    await tx.$executeRawUnsafe('DROP TABLE IF EXISTS "SeoPage"');
    await tx.$executeRawUnsafe('DROP TABLE IF EXISTS "SeoSettings"');

    await tx.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SeoSettings" (
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
        "updatedAt" DATETIME NOT NULL
      )
    `);

    await tx.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SeoPage" (
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
        "updatedAt" DATETIME NOT NULL
      )
    `);

    await tx.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "SeoPage_pageKey_key" ON "SeoPage"("pageKey")');
  });
}

export async function ensureSeoTablesAreCompatible() {
  if (repairPromise) {
    await repairPromise;
    return;
  }

  repairPromise = (async () => {
  const [legacySettings, legacyPages] = await Promise.all([
    hasLegacyStringId("SeoSettings"),
    hasLegacyStringId("SeoPage"),
  ]);

  if (!legacySettings && !legacyPages) {
    return;
  }

  await rebuildSeoTables();
  })();

  try {
    await repairPromise;
  } finally {
    repairPromise = null;
  }
}