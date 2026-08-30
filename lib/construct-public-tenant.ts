import "server-only";

import { getConstructRequestHostname } from "@/lib/construct-host";
import { getConstructPrisma } from "@/lib/construct-prisma";

export async function resolvePublicConstructOrganization() {
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
}
