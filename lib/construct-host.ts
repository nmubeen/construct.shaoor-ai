import "server-only";

import { headers } from "next/headers";

export function hostnameFromValue(value: string | null) {
  const first = value?.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("[")) return first.slice(1, first.indexOf("]"));
  return first.split(":")[0];
}

export function configuredConstructHostname() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return "construct.shaoor-ai.com";
  try {
    return new URL(appUrl).hostname.toLowerCase();
  } catch {
    return "construct.shaoor-ai.com";
  }
}

export async function getConstructRequestHostname() {
  const requestHeaders = await headers();
  return hostnameFromValue(
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"),
  );
}

export async function isConstructPortalRequest() {
  const hostname = await getConstructRequestHostname();
  return (
    hostname === configuredConstructHostname() ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}
