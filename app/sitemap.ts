import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { getDefaultSEO, resolveBaseUrl } from "@/lib/seo";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { resolvePublicConstructOrganization } from "@/lib/construct-public-tenant";
import { ensureConstructSeoDefaults } from "@/lib/services/construct-seo.service";

type StaticPage = {
  path: string;
  pageKey?: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
};

const staticPages: readonly StaticPage[] = [
  { path: "/", pageKey: "home", changeFrequency: "weekly", priority: 1 },
  {
    path: "/about",
    pageKey: "about",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/services",
    pageKey: "services",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/projects",
    pageKey: "projects",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/projects/completed",
    pageKey: "projects",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/projects/ongoing",
    pageKey: "projects",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  { path: "/process", changeFrequency: "monthly", priority: 0.7 },
  {
    path: "/team",
    pageKey: "team",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/contact",
    pageKey: "contact",
    changeFrequency: "yearly",
    priority: 0.6,
  },
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const constructOrganization = await resolvePublicConstructOrganization();
  if (constructOrganization) {
    await ensureConstructSeoDefaults(constructOrganization.id);
    const constructPrisma = getConstructPrisma();
    const [settings, seoPages, projects, services, publication] = await Promise.all([
      constructPrisma.seoSettings.findUniqueOrThrow({ where: { organizationId: constructOrganization.id } }),
      constructPrisma.seoPage.findMany({ where: { organizationId: constructOrganization.id }, select: { pageKey: true, robotsIndex: true, updatedAt: true } }),
      constructPrisma.project.findMany({ where: { organizationId: constructOrganization.id }, select: { slug: true, updatedAt: true } }),
      constructPrisma.service.findMany({ where: { organizationId: constructOrganization.id, isActive: true }, select: { slug: true, updatedAt: true } }),
      constructPrisma.sitePublication.findUnique({ where: { organizationId: constructOrganization.id } }),
    ]);
    if (!settings.robotsIndex || publication?.status !== "PUBLISHED") return [];
    const baseUrl = resolveBaseUrl(settings.siteUrl);
    const pageSeo = new Map(seoPages.map(page => [page.pageKey, page]));
    const isIndexable = (key: string) => pageSeo.get(key)?.robotsIndex !== false;
    const url = (path: string) => new URL(path, `${baseUrl}/`).toString();
    const entries: MetadataRoute.Sitemap = staticPages.filter(page => !page.pageKey || isIndexable(page.pageKey)).map(page => ({ url: url(page.path), lastModified: page.pageKey ? pageSeo.get(page.pageKey)?.updatedAt : undefined, changeFrequency: page.changeFrequency, priority: page.priority }));
    if (isIndexable("projects")) entries.push(...projects.map(project => ({ url: url(`/projects/${encodeURIComponent(project.slug)}`), lastModified: project.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })));
    if (isIndexable("services")) entries.push(...services.map(service => ({ url: url(`/services/${encodeURIComponent(service.slug)}`), lastModified: service.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })));
    return [...new Map(entries.map(entry => [entry.url, entry])).values()];
  }
  const seo = await getDefaultSEO();

  if (!seo.robots.index) {
    return [];
  }

  const [seoPages, projects, services] = await Promise.all([
    prisma.seoPage.findMany({
      select: { pageKey: true, robotsIndex: true, updatedAt: true },
    }),
    prisma.project.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const baseUrl = resolveBaseUrl(seo.siteUrl);
  const pageSeo = new Map(seoPages.map((page) => [page.pageKey, page]));
  const isIndexable = (pageKey: string) =>
    pageSeo.get(pageKey)?.robotsIndex !== false;
  const url = (path: string) => new URL(path, `${baseUrl}/`).toString();

  const entries: MetadataRoute.Sitemap = staticPages
    .filter((page) => !page.pageKey || isIndexable(page.pageKey))
    .map((page) => ({
      url: url(page.path),
      lastModified: page.pageKey
        ? pageSeo.get(page.pageKey)?.updatedAt
        : undefined,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }));

  if (isIndexable("projects")) {
    entries.push(
      ...projects.map((project) => ({
        url: url(`/projects/${encodeURIComponent(project.slug)}`),
        lastModified: project.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }))
    );
  }

  if (isIndexable("services")) {
    entries.push(
      ...services.map((service) => ({
        url: url(`/services/${encodeURIComponent(service.slug)}`),
        lastModified: service.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }))
    );
  }

  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
