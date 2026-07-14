import crypto from "crypto";
import { AUTH } from "@/lib/constants";

/**
 * Generates a cryptographically secure random session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

/**
 * Returns the session expiry date.
 */
export function getSessionExpiry(): Date {
  const expires = new Date();

  expires.setDate(
    expires.getDate() + AUTH.SESSION_DAYS
  );

  return expires;
}