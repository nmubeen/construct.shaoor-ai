import { NextResponse } from "next/server";

import { synchronizeConstructUser } from "@/lib/auth/construct-context";
import { isSafeConstructRedirect } from "@/lib/auth/construct-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const nextPath = isSafeConstructRedirect(requestedNext) ? requestedNext : "/account/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) await synchronizeConstructUser(user);
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  }

  return NextResponse.redirect(
    new URL("/account/login?error=The authentication link is invalid or has expired.", request.url),
  );
}
