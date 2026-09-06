const requiredPublicKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

export function getSupabasePublicEnvironment() {
  const missing = requiredPublicKeys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
  };
}

export function hasSupabasePublicEnvironment() {
  return requiredPublicKeys.every((key) => Boolean(process.env[key]));
}

export function getConstructDatabaseUrl() {
  const url = process.env.CONSTRUCT_DATABASE_URL;

  if (!url) {
    throw new Error("Missing CONSTRUCT_DATABASE_URL.");
  }

  if (process.env.NODE_ENV !== "production") return url;

  // A single tenant page render fires ~8-10 distinct queries concurrently
  // (site settings, services, projects, team, stats, SEO...). At
  // connection_limit=1 they all queue behind one connection and several
  // throw P2024 ("Timed out fetching a new connection from the pool")
  // once the 10s pool timeout is exceeded — confirmed live in production
  // logs for test4.construct.shaoor-ai.com. 3 gives enough headroom for
  // that per-request fan-out without meaningfully raising the shared
  // Postgres instance's total connection load (this DB also serves
  // Pets and Chat) — each Lambda instance still holds only a handful of
  // connections, not dozens.
  const productionUrl = new URL(url);
  if (!productionUrl.searchParams.has("connection_limit")) {
    productionUrl.searchParams.set("connection_limit", "3");
  }
  return productionUrl.toString();
}
