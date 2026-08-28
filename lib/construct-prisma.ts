import "server-only";

import { PrismaClient } from "@prisma/construct-client";
import { getConstructDatabaseUrl } from "@/lib/env/supabase";

const globalForConstructPrisma = globalThis as unknown as {
  constructPrisma?: PrismaClient;
};

export function getConstructPrisma() {
  const client =
    globalForConstructPrisma.constructPrisma ??
    new PrismaClient({ datasourceUrl: getConstructDatabaseUrl() });

  if (process.env.NODE_ENV !== "production") {
    globalForConstructPrisma.constructPrisma = client;
  }

  return client;
}
