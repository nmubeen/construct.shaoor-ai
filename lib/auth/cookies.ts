import { cookies } from "next/headers";
import { AUTH } from "@/lib/constants";

/**
 * Stores the session token in an HttpOnly cookie.
 */
export async function setSessionCookie(
  token: string,
  expires: Date
) {
  const cookieStore = await cookies();

  cookieStore.set(AUTH.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/**
 * Returns the current session token.
 */
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH.COOKIE_NAME)?.value ?? null;
}

/**
 * Removes the session cookie.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH.COOKIE_NAME);
}