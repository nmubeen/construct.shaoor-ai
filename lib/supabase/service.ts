import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnvironment, getSupabaseServiceEnvironment } from "@/lib/env/supabase";

// A privileged, session-less Supabase client (the secret/service-role
// key, not the publishable key + user cookies that lib/supabase/server.ts
// uses) — bypasses Storage RLS entirely. Use ONLY for the private
// construct-progress-media bucket, and ONLY after this app's own server
// code has already authorized the operation itself: staff mutations
// re-check organization membership, role and the PRIVATE_PROJECT_PROGRESS
// entitlement; the public customer route re-checks the bearer token,
// expiry, revocation, organization status and the same entitlement. This
// client has no memory of any of that — it trusts the caller completely,
// exactly like any other "already-authorized trusted server code" use of
// a service-role key. Never import this into a "use client" file, never
// return anything derived from it (paths, errors) verbatim to a client
// response, and never log the key itself.
export function getConstructServiceSupabase() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getSupabasePublicEnvironment();
  const { SUPABASE_SECRET_KEY } = getSupabaseServiceEnvironment();
  return createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
