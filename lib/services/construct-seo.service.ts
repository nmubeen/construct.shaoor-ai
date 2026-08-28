import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";

export const CONSTRUCT_SEO_PAGES = [
  { pageKey: "home", pageName: "Home", path: "/" },
  { pageKey: "about", pageName: "About", path: "/about" },
  { pageKey: "services", pageName: "Services", path: "/services" },
  { pageKey: "projects", pageName: "Projects", path: "/projects" },
  { pageKey: "process", pageName: "Process", path: "/process" },
  { pageKey: "team", pageName: "Team", path: "/team" },
  { pageKey: "contact", pageName: "Contact", path: "/contact" },
] as const;

export async function ensureConstructSeoDefaults(organizationId: string) {
  const prisma = getConstructPrisma();
  const [site, domain, existing] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { organizationId } }),
    prisma.domain.findFirst({ where: { organizationId, isPrimary: true }, orderBy: { createdAt: "asc" } }),
    prisma.seoSettings.findUnique({ where: { organizationId } }),
  ]);
  if (!site) throw new Error("Site settings must be configured before SEO settings.");
  const siteUrl = site.website || (domain ? `https://${domain.hostname}` : "https://construct.shaoor-ai.com");
  const settings = existing ?? await prisma.seoSettings.create({ data: {
    organizationId, siteName: site.companyName, defaultTitle: site.companyName,
    defaultDescription: site.description || site.tagline, defaultKeywords: null, siteUrl,
    defaultOgImageUrl: site.heroImageUrl, faviconUrl: site.faviconUrl,
  } });
  await Promise.all(CONSTRUCT_SEO_PAGES.map(page => prisma.seoPage.upsert({
    where: { organizationId_pageKey: { organizationId, pageKey: page.pageKey } }, update: {},
    create: { organizationId, pageKey: page.pageKey, pageName: page.pageName, title: `${page.pageName} | ${settings.siteName}`, description: settings.defaultDescription, canonicalUrl: new URL(page.path, `${settings.siteUrl.replace(/\/$/, "")}/`).toString(), ogTitle: `${page.pageName} | ${settings.siteName}`, ogDescription: settings.defaultDescription, ogImageUrl: settings.defaultOgImageUrl, robotsIndex: settings.robotsIndex, robotsFollow: settings.robotsFollow },
  })));
  return settings;
}
