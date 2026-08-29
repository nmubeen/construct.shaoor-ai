import "server-only";

import { PrismaClient } from "@prisma/construct-client";
import { getConstructDatabaseUrl } from "@/lib/env/supabase";

const globalForConstructPrisma = globalThis as unknown as {
  constructPrisma?: PrismaClient;
};

export function getConstructPrisma() {
  if (!globalForConstructPrisma.constructPrisma) {
    globalForConstructPrisma.constructPrisma = new PrismaClient({
      datasourceUrl: getConstructDatabaseUrl(),
    });
  }

  return globalForConstructPrisma.constructPrisma;
}
