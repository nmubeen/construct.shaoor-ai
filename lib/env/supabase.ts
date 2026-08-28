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

  return url;
}
