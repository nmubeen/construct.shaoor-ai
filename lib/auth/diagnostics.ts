// Safe, non-production-only diagnostic logging for the OTP/membership/
// provisioning pipeline — so a live failure can be categorized without
// guessing from one generic user-facing message. Never pass anything but a
// fixed category string here: no OTP codes, access tokens, emails, or other
// request data. Mirrors TuiTrak's lib/auth/diagnostics.ts.
export type AuthDiagnosticCategory =
  | "membership_rpc_failed"
  | "membership_missing"
  | "membership_inactive"
  | "membership_suspended"
  | "account_missing"
  | "account_provisioning_failed"
  | "commercial_access_denied";

export function logAuthDiagnostic(category: AuthDiagnosticCategory) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[construct-auth] ${category}`);
  }
}
