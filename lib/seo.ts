import { prisma } from "@/lib/prisma";
import { ensureSeoDefaults } from "@/lib/actions/seo.actions";
import { getSiteSettings } from "@/lib/settings";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { resolvePublicConstructOrganization } from "@/lib/construct-public-tenant";
import { ensureConstructSeoDefaults } from "@/lib/services/construct-seo.service";
import type { Metadata } from "next";

export interface SeoMetadataResult {
  title: string;
  description: string;
  keywords: string | null;
  canonicalUrl: string | null;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  robots: {
    index: boolean;
    follow: boolean;
  };
  verification: {
    google: string | null;
    bing: string | null;
  };
  twitterHandle: string | null;
  facebookAppId: string | null;
  siteName: string;
  siteUrl: string;
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  if (/^<<[^<>]+>>$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeOptionalText(value);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function isLocalHostName(hostname: string) {
  const lower = hostname.toLowerCase();

  return (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "::1" ||
    lower.endsWith(".localhost")
  );
}

function toOrigin(value: string) {
  const normalized = value.includes("://") ? value : `https://${value}`;
  return new URL(normalized).origin;
}

function normalizeRoutePath(path: string) {
  const withoutHash = path.split("#", 1)[0] ?? "";
  const withoutQuery = withoutHash.split("?", 1)[0] ?? "";
  const prefixed = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;

  if (prefixed.length > 1 && prefixed.endsWith("/")) {
    return prefixed.slice(0, -1);
  }

  return prefixed || "/";
}

function normalizeAbsoluteCanonical(value: string, baseUrl: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    const asPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    url = new URL(asPath, `${baseUrl}/`);
  }

  url.pathname = normalizeRoutePath(url.pathname);
  url.search = "";
  url.hash = "";

  return url.toString();
}

export function resolveBaseUrl(configuredUrl: string) {
  const fallbackValues = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ];

  const candidates = [configuredUrl, ...fallbackValues]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  const origins = candidates.map((value) => toOrigin(value));

  if (origins.length === 0) {
    throw new Error("A site URL must be configured.");
  }

  const firstNonLocalhost = origins.find((origin) => {
    try {
      const url = new URL(origin);
      return !isLocalHostName(url.hostname);
    } catch {
      return false;
    }
  });

  return firstNonLocalhost ?? origins[0];
}

export function resolveCanonicalUrl({
  baseUrl,
  routePath,
  explicitCanonicalUrl,
}: {
  baseUrl: string;
  routePath: string;
  explicitCanonicalUrl?: string | null;
}) {
  const routeCanonical = new URL(normalizeRoutePath(routePath), `${baseUrl}/`).toString();

  if (!explicitCanonicalUrl) {
    return routeCanonical;
  }

  const explicitCanonical = normalizeAbsoluteCanonical(explicitCanonicalUrl, baseUrl);
  return explicitCanonical ?? routeCanonical;
}

export function canonicalAlternates(canonicalUrl: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: canonicalUrl,
  };
}

function normalizeImageUrl(value: string | null, baseUrl: string) {
  if (!value) {
    return null;
  }

  if (value.startsWith("/")) {
    return new URL(value, `${baseUrl}/`).toString();
  }

  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function normalizeKeywords(keywords: string | null) {
  if (!keywords) {
    return undefined;
  }

  const parts = keywords
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : undefined;
}

function buildPublicMetadata({
  baseUrl,
  canonicalUrl,
  title,
  description,
  siteName,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  robots,
  twitterHandle,
}: {
  baseUrl: string;
  canonicalUrl: string;
  title: string;
  description: string;
  siteName: string;
  keywords: string | null;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  robots: {
    index: boolean;
    follow: boolean;
  };
  twitterHandle: string | null;
}): Metadata {
  const normalizedImage = normalizeImageUrl(ogImage, baseUrl);

  return {
    title,
    description,
    keywords: normalizeKeywords(keywords),
    alternates: canonicalAlternates(canonicalUrl),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName,
      type: "website",
      images: normalizedImage ? [{ url: normalizedImage }] : undefined,
    },
    twitter: {
      card: normalizedImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      site: twitterHandle ?? undefined,
      images: normalizedImage ? [normalizedImage] : undefined,
    },
    robots: {
      index: robots.index,
      follow: robots.follow,
    },
  };
}

function defaultRoutePathFromPageKey(pageKey: string) {
  return pageKey === "home" ? "/" : `/${pageKey}`;
}

export async function getCanonicalForSeoPage({
  pageKey,
  routePath,
  seo,
}: {
  pageKey: string;
  routePath: string;
  seo?: SeoMetadataResult;
}) {
  const resolvedSeo = seo ?? (await getPageSEO(pageKey));
  const baseUrl = resolveBaseUrl(resolvedSeo.siteUrl);

  const legacyDefaultCanonical = new URL(
    defaultRoutePathFromPageKey(pageKey),
    `${baseUrl}/`
  ).toString();
  const normalizedPageCanonical = resolvedSeo.canonicalUrl
    ? normalizeAbsoluteCanonical(resolvedSeo.canonicalUrl, baseUrl)
    : null;
  const explicitOverride =
    normalizedPageCanonical && normalizedPageCanonical !== legacyDefaultCanonical
      ? normalizedPageCanonical
      : null;

  return resolveCanonicalUrl({
    baseUrl,
    routePath,
    explicitCanonicalUrl: explicitOverride,
  });
}

export async function getCanonicalForRoute({
  routePath,
  explicitCanonicalUrl,
  seo,
}: {
  routePath: string;
  explicitCanonicalUrl?: string | null;
  seo?: SeoMetadataResult;
}) {
  const resolvedSeo = seo ?? (await getDefaultSEO());
  const baseUrl = resolveBaseUrl(resolvedSeo.siteUrl);

  return resolveCanonicalUrl({
    baseUrl,
    routePath,
    explicitCanonicalUrl,
  });
}

export async function getSeoPageMetadata({
  pageKey,
  routePath,
}: {
  pageKey: string;
  routePath: string;
}): Promise<Metadata> {
  const seo = await getPageSEO(pageKey);
  const baseUrl = resolveBaseUrl(seo.siteUrl);
  const canonicalUrl = await getCanonicalForSeoPage({
    pageKey,
    routePath,
    seo,
  });

  return buildPublicMetadata({
    baseUrl,
    canonicalUrl,
    title: seo.title,
    description: seo.description,
    siteName: seo.siteName,
    keywords: seo.keywords,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImage: seo.ogImage,
    robots: seo.robots,
    twitterHandle: seo.twitterHandle,
  });
}

export async function getRouteMetadata({
  routePath,
  explicitCanonicalUrl,
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
}: {
  routePath: string;
  explicitCanonicalUrl?: string | null;
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
}): Promise<Metadata> {
  const seo = await getDefaultSEO();
  const baseUrl = resolveBaseUrl(seo.siteUrl);
  const canonicalUrl = await getCanonicalForRoute({
    routePath,
    explicitCanonicalUrl,
    seo,
  });

  return buildPublicMetadata({
    baseUrl,
    canonicalUrl,
    title: title?.trim() || seo.title,
    description: description?.trim() || seo.description,
    siteName: seo.siteName,
    keywords: keywords ?? seo.keywords,
    ogTitle: ogTitle?.trim() || title?.trim() || seo.ogTitle,
    ogDescription: ogDescription?.trim() || description?.trim() || seo.ogDescription,
    ogImage: ogImage ?? seo.ogImage,
    robots: seo.robots,
    twitterHandle: seo.twitterHandle,
  });
}

export async function getDefaultSEO(): Promise<SeoMetadataResult> {
  const constructOrganization = await resolvePublicConstructOrganization();
  if (constructOrganization) {
    await ensureConstructSeoDefaults(constructOrganization.id);
    const [settings, publication] = await Promise.all([getConstructPrisma().seoSettings.findUniqueOrThrow({ where: { organizationId: constructOrganization.id } }), getConstructPrisma().sitePublication.findUnique({ where: { organizationId: constructOrganization.id } })]);
    const isPublished = publication?.status === "PUBLISHED";
    return {
      title: settings.defaultTitle, description: settings.defaultDescription,
      keywords: normalizeOptionalText(settings.defaultKeywords), canonicalUrl: settings.siteUrl,
      ogTitle: settings.defaultTitle, ogDescription: settings.defaultDescription,
      ogImage: normalizeOptionalText(settings.defaultOgImageUrl),
      robots: { index: isPublished && settings.robotsIndex, follow: isPublished && settings.robotsFollow },
      verification: { google: normalizeOptionalText(settings.googleVerification), bing: normalizeOptionalText(settings.bingVerification) },
      twitterHandle: normalizeOptionalText(settings.twitterHandle), facebookAppId: normalizeOptionalText(settings.facebookAppId),
      siteName: settings.siteName, siteUrl: settings.siteUrl,
    };
  }
  await ensureSeoDefaults();

  const appSettings = await getSiteSettings();
  const fallbackTitle =
    firstNonEmpty(appSettings.seoTitle, appSettings.companyName, "Company Name") ??
    "Company Name";
  const fallbackDescription =
    firstNonEmpty(
      appSettings.seoDescription,
      appSettings.description,
      "Professional construction company delivering quality projects."
    ) ?? "Professional construction company delivering quality projects.";
  const fallbackSiteName =
    firstNonEmpty(appSettings.companyName, "Company Name") ?? "Company Name";
  const fallbackSiteUrl =
    firstNonEmpty(appSettings.website, "https://example.com") ?? "https://example.com";
  const settings = await prisma.seoSettings.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!settings) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      keywords: null,
      canonicalUrl: null,
      ogTitle: fallbackTitle,
      ogDescription: fallbackDescription,
      ogImage: null,
      robots: {
        index: true,
        follow: true,
      },
      verification: {
        google: null,
        bing: null,
      },
      twitterHandle: null,
      facebookAppId: null,
      siteName: fallbackSiteName,
      siteUrl: fallbackSiteUrl,
    };
  }

  const siteName = firstNonEmpty(settings.siteName, fallbackSiteName) ?? fallbackSiteName;
  const siteUrl = firstNonEmpty(settings.siteUrl, fallbackSiteUrl) ?? fallbackSiteUrl;
  const title = firstNonEmpty(settings.defaultTitle, fallbackTitle) ?? fallbackTitle;
  const description =
    firstNonEmpty(settings.defaultDescription, fallbackDescription) ?? fallbackDescription;

  return {
    title,
    description,
    keywords: normalizeOptionalText(settings.defaultKeywords),
    canonicalUrl: siteUrl,
    ogTitle: firstNonEmpty(settings.defaultTitle, title) ?? title,
    ogDescription: firstNonEmpty(settings.defaultDescription, description) ?? description,
    ogImage: normalizeOptionalText(settings.defaultOgImage),
    robots: {
      index: settings.robotsIndex,
      follow: settings.robotsFollow,
    },
    verification: {
      google: normalizeOptionalText(settings.googleVerification),
      bing: normalizeOptionalText(settings.bingVerification),
    },
    twitterHandle: normalizeOptionalText(settings.twitterHandle),
    facebookAppId: normalizeOptionalText(settings.facebookAppId),
    siteName,
    siteUrl,
  };
}

export async function getPageSEO(
  pageKey: string
): Promise<SeoMetadataResult> {
  const constructOrganization = await resolvePublicConstructOrganization();
  if (constructOrganization) {
    await ensureConstructSeoDefaults(constructOrganization.id);
    const prisma = getConstructPrisma();
    const [settings, page, publication] = await Promise.all([
      prisma.seoSettings.findUniqueOrThrow({ where: { organizationId: constructOrganization.id } }),
      prisma.seoPage.findUnique({ where: { organizationId_pageKey: { organizationId: constructOrganization.id, pageKey } } }),
      prisma.sitePublication.findUnique({ where: { organizationId: constructOrganization.id } }),
    ]);
    if (!page) return getDefaultSEO();
    return {
      title: page.title, description: page.description,
      keywords: normalizeOptionalText(page.keywords) ?? normalizeOptionalText(settings.defaultKeywords),
      canonicalUrl: normalizeOptionalText(page.canonicalUrl),
      ogTitle: normalizeOptionalText(page.ogTitle) ?? page.title,
      ogDescription: normalizeOptionalText(page.ogDescription) ?? page.description,
      ogImage: normalizeOptionalText(page.ogImageUrl) ?? normalizeOptionalText(settings.defaultOgImageUrl),
      robots: { index: publication?.status === "PUBLISHED" && page.robotsIndex, follow: publication?.status === "PUBLISHED" && page.robotsFollow },
      verification: { google: normalizeOptionalText(settings.googleVerification), bing: normalizeOptionalText(settings.bingVerification) },
      twitterHandle: normalizeOptionalText(settings.twitterHandle), facebookAppId: normalizeOptionalText(settings.facebookAppId),
      siteName: settings.siteName, siteUrl: settings.siteUrl,
    };
  }
  await ensureSeoDefaults();

  const [settings, page] = await Promise.all([
    prisma.seoSettings.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.seoPage.findFirst({
      where: {
        pageKey,
      },
    }),
  ]);

  const fallback = await getDefaultSEO();

  if (!page) {
    return fallback;
  }

  const siteUrl =
    firstNonEmpty(settings?.siteUrl, fallback.siteUrl) ?? fallback.siteUrl;
  const pageTitle = firstNonEmpty(page.title, fallback.title) ?? fallback.title;
  const pageDescription =
    firstNonEmpty(page.description, fallback.description) ?? fallback.description;
  const ogTitle = firstNonEmpty(page.ogTitle, pageTitle, fallback.ogTitle) ?? pageTitle;
  const ogDescription =
    firstNonEmpty(page.ogDescription, pageDescription, fallback.ogDescription) ??
    pageDescription;
  const canonicalUrl =
    firstNonEmpty(page.canonicalUrl) ??
    `${siteUrl}${page.pageKey === "home" ? "/" : `/${page.pageKey}`}`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: normalizeOptionalText(page.keywords) ?? fallback.keywords,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage:
      firstNonEmpty(page.ogImage, settings?.defaultOgImage, fallback.ogImage) ?? null,
    robots: {
      index: page.robotsIndex,
      follow: page.robotsFollow,
    },
    verification: {
      google:
        firstNonEmpty(settings?.googleVerification, fallback.verification.google) ?? null,
      bing:
        firstNonEmpty(settings?.bingVerification, fallback.verification.bing) ?? null,
    },
    twitterHandle: firstNonEmpty(settings?.twitterHandle, fallback.twitterHandle),
    facebookAppId: firstNonEmpty(settings?.facebookAppId, fallback.facebookAppId),
    siteName: firstNonEmpty(settings?.siteName, fallback.siteName) ?? fallback.siteName,
    siteUrl,
  };
}
