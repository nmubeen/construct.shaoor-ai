// Shared cross-app membership gate (public.app_memberships / the
// register_app_membership / get_my_app_membership RPCs) — adapted from
// TuiTrak's lib/auth/membership.ts. This is an IDENTITY gate only ("does
// this account have standing access to Construct at all", e.g. an
// ops-level suspension) and is deliberately independent of Construct's own
// organization/subscription gate (lib/control/construct-subscription.service.ts,
// unchanged) and of construct.memberships (a *local* org-level role table —
// a different "membership" concept entirely, hence "AppMembership" here to
// avoid confusion with Prisma's Membership model).
//
// Unlike TuiTrak, Construct never scopes a supabase-js client away from the
// default "public" schema (its own business data is 100% Prisma, never
// PostgREST) — so there's no need for a dedicated lib/auth/server.ts client
// the way TuiTrak has one; lib/supabase/server.ts's plain client already
// calls client.rpc(...) against "public" with no .schema() override
// needed. These helpers accept that client directly.
import type { SupabaseClient } from "@supabase/supabase-js";
import { authAppConfig } from "./config";
import { logAuthDiagnostic } from "./diagnostics";

export type AppMembership = { status: string; role: string | null };

export function parseMembership(data: unknown): AppMembership | null {
  const row = Array.isArray(data) ? (data.length === 1 ? data[0] : null) : data;
  if (!row || typeof row !== "object" || !("status" in row) || typeof row.status !== "string") return null;
  return { status: row.status, role: "role" in row && typeof row.role === "string" ? row.role : null };
}

/** Read-only lookup — does not create a row or touch last_login_at. */
export async function getAppMembership(client: SupabaseClient): Promise<AppMembership | null> {
  const { data, error } = await client.rpc("get_my_app_membership", { p_app_key: authAppConfig.key });
  if (error) throw new Error("Membership lookup failed");
  return parseMembership(data);
}

/** Upserts the membership row (active/user on first call) and bumps
 * last_login_at — call this once per actual sign-in (see
 * lib/auth/actions.ts), not on every request. */
export async function registerAppMembership(client: SupabaseClient): Promise<AppMembership | null> {
  const { data, error } = await client.rpc("register_app_membership", { p_app_key: authAppConfig.key });
  if (error) throw new Error("Membership registration failed");
  return parseMembership(data);
}

/** Server-side per-request guard: a plain read, falling back to register()
 * only when no row exists yet — self-heals sessions that reached a
 * protected route without ever completing the sign-in registration step
 * (a race right after verifyOtp, a session that predates this feature, or
 * one established via the team invitation email-link flow, which never
 * calls submitAuth() at all — see lib/auth/construct-context.ts). Does not
 * re-bump last_login_at on every ordinary page view. */
export async function ensureAppMembership(client: SupabaseClient): Promise<AppMembership | null> {
  const membership = await getAppMembership(client);
  if (membership) return membership;
  return registerAppMembership(client);
}

// User-facing copy stays deliberately generic for every "membership-*"
// reason (see app/account/error/page.tsx) — a suspended/inactive/missing/
// RPC-failed membership must never be distinguishable to the caller. The
// `cause` param exists only so callers that already know WHY membership
// resolved to null can log that distinction for diagnosis, without those
// categories ever leaking into the URL/UI.
export function membershipError(membership: AppMembership | null, cause?: "rpc-failed" | "missing") {
  if (membership?.status === "suspended") {
    logAuthDiagnostic("membership_suspended");
    return "membership-suspended";
  }
  if (membership?.status === "inactive") {
    logAuthDiagnostic("membership_inactive");
    return "membership-inactive";
  }
  logAuthDiagnostic(cause === "rpc-failed" ? "membership_rpc_failed" : "membership_missing");
  return "membership-unavailable";
}
