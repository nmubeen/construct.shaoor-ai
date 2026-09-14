export function isSafeConstructRedirect(path: string | null): path is string {
  if (!path) return false;
  // No more password reset flow (Construct is OTP-only) — /dashboard and a
  // team invitation's own accept link are the only two post-auth
  // destinations left worth special-casing.
  if (path === "/dashboard") return true;
  return /^\/account\/invitations\/[a-f0-9]{64}$/.test(path);
}
