import "server-only";

import { headers } from "next/headers";

import { getConstructPrisma } from "@/lib/construct-prisma";

function hostnameFromHeader(value: string | null) {
  const first = value?.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("[")) return first.slice(1, first.indexOf("]"));
  return first.split(":")[0];
}

function hostnameFromUrl(value: string | undefined) {
  if (!value) return "";
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export async function resolvePublicConstructOrganization() {
  const requestHeaders = await headers();
  const hostname = hostnameFromHeader(requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"));
  const prisma = getConstructPrisma();

  if (hostname) {
    const domain = await prisma.domain.findFirst({
      where: { hostname, status: "ACTIVE", organization: { status: "ACTIVE" } },
      select: { organization: true },
    });
    if (domain) return domain.organization;

    const suffix = ".construct.shaoor-ai.com";
    if (hostname.endsWith(suffix)) {
      const slug = hostname.slice(0, -suffix.length);
      if (slug && !slug.includes(".")) {
        const organization = await prisma.organization.findFirst({ where: { slug, status: "ACTIVE" } });
        if (organization) return organization;
      }
    }
  }

  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  const canonicalHostname = hostnameFromUrl(process.env.NEXT_PUBLIC_APP_URL);
  const isCanonicalHost = Boolean(canonicalHostname) && hostname === canonicalHostname;
  if (!isLocal && !isCanonicalHost) return null;
  const configuredSlug = process.env.CONSTRUCT_DEFAULT_TENANT_SLUG?.trim().toLowerCase();
  if (configuredSlug) return prisma.organization.findFirst({ where: { slug: configuredSlug, status: "ACTIVE" } });
  const activeOrganizations = await prisma.organization.findMany({ where: { status: "ACTIVE" }, take: 2 });
  return activeOrganizations.length === 1 ? activeOrganizations[0] : null;
}
