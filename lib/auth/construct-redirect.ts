export function isSafeConstructRedirect(path: string | null): path is string {
  if (!path) return false;
  if (path === "/account/onboarding" || path === "/account/reset-password" || path === "/dashboard") return true;
  return /^\/account\/invitations\/[a-f0-9]{64}$/.test(path);
}
