import "server-only";

import { cache } from "react";
import { getConstructRequestHostname } from "@/lib/construct-host";
import { getConstructPrisma } from "@/lib/construct-prisma";

// Wrapped in React's cache(): this is called 17+ times across a single
// page render (Header, Footer, the layout, every lib/public-site-data.ts
// function, sitemap, SEO metadata...), each call otherwise doing its own
// 1-2 DB round trips. Production's Prisma client is deliberately capped
// at connection_limit=1 (see getConstructDatabaseUrl), so every one of
// those redundant queries serializes through a single connection instead
// of running in parallel — confirmed live: a tenant site was taking
// 40-90+ seconds to render (vs. 0.5s for the portal, which never reaches
// this function at all), long enough that Vercel's function timeout was
// killing the request before it finished, which is what showed up as
// "Something went wrong". cache() collapses all of this to one lookup
// per request.
export const resolvePublicConstructOrganization = cache(async () => {
  const hostname = await getConstructRequestHostname();
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
        const organization = await prisma.organization.findFirst({
          where: { slug, status: "ACTIVE" },
        });
        if (organization) return organization;
      }
    }
  }

  return null;
});
