// Deliberately NOT `requiredPublicKeys.every(key => process.env[key])`:
// Next.js/Turbopack can only inline a NEXT_PUBLIC_* value into the client
// bundle by statically replacing a literal `process.env.NEXT_PUBLIC_X`
// expression at build time. It can't do that for computed/dynamic access
// like `process.env[key]` — there's no way to know what string `key` will
// be at build time — so that lookup silently falls through to the
// browser's real (empty) `process.env` and always resolves to undefined,
// regardless of what's actually configured. Every reference below must
// therefore spell out each key literally so the bundler can replace it.
export function getSupabasePublicEnvironment() {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
  };
}

export function hasSupabasePublicEnvironment() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
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
