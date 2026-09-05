// Split out from lib/actions/construct-auth.actions.ts (a "use server"
// file, which can only export async actions) so app/dashboard/team/
// page.tsx can build a real shareable invite link too, not just the
// signup action itself.
export function appUrl() {
  if (process.env.VERCEL_ENV === "production") {
    return "https://construct.shaoor-ai.com";
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
