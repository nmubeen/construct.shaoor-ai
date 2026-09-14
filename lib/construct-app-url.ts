// Split out into its own file (rather than living in a "use server" actions
// file, which can only export async actions) so app/dashboard/team/
// page.tsx can build a real shareable invite link too, not just
// lib/auth/actions.ts's own emailRedirectTo.
export function appUrl() {
  if (process.env.VERCEL_ENV === "production") {
    return "https://construct.shaoor-ai.com";
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
