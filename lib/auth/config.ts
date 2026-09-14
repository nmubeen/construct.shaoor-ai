// Centralizes Construct's identity within the shared shaoor-ai.com auth
// system, so "construct"/"Shaoor Construct" strings aren't scattered across
// the app — mirrors TuiTrak's lib/auth/config.ts (authAppConfig).
//
// key MUST match the "key" column already registered for this app in the
// shared public.applications table — confirmed live: key "construct",
// domain "construct.shaoor-ai.com" (also the hostname the shared
// send-auth-email hook matches against for branding — see
// lib/construct-app-url.ts's appUrl(), used for emailRedirectTo in
// lib/auth/actions.ts).
export const authAppConfig = {
  key: process.env.NEXT_PUBLIC_APP_KEY || "construct",
  name: process.env.NEXT_PUBLIC_APP_NAME || "Shaoor Construct",
};
