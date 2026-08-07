import type { Settings } from "@prisma/client";

import { resolveBaseUrl, type SeoMetadataResult } from "@/lib/seo";

type PublicSettings = Pick<
  Settings,
  | "companyName"
  | "tagline"
  | "description"
  | "logo"
  | "phone"
  | "email"
  | "website"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "state"
  | "country"
  | "postalCode"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "youtube"
  | "heroImage"
>;

type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

type BreadcrumbItem = {
  name: string;
  url: string;
};

type ProjectSchemaSource = {
  slug: string;
  title: string;
  description: string;
  coverImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  gallery: Array<{ image: string }>;
};

type ServiceSchemaSource = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
};

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function absoluteUrl(value: string | null | undefined, baseUrl: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("/")) {
    return new URL(normalized, `${baseUrl}/`).toString();
  }

  try {
    const url = new URL(normalized);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }

    return null;
  } catch {
    return null;
  }
}

function absoluteExternalUrl(value: string | null | undefined) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }

    return null;
  } catch {
    return null;
  }
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeText(value);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function buildAddress(settings: PublicSettings) {
  const streetAddress = [settings.addressLine1, settings.addressLine2]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(", ");

  const address = {
    "@type": "PostalAddress",
    streetAddress: normalizeText(streetAddress),
    addressLocality: normalizeText(settings.city),
    addressRegion: normalizeText(settings.state),
    addressCountry: normalizeText(settings.country),
    postalCode: normalizeText(settings.postalCode),
  };

  const hasValue = Object.values(address).some(Boolean);
  return hasValue ? address : null;
}

function buildSameAs(settings: PublicSettings) {
  return [
    absoluteExternalUrl(settings.facebook),
    absoluteExternalUrl(settings.instagram),
    absoluteExternalUrl(settings.linkedin),
    absoluteExternalUrl(settings.twitter),
    absoluteExternalUrl(settings.youtube),
  ].filter((value): value is string => Boolean(value));
}

function resolveCanonicalUrl(baseUrl: string, path: string) {
  return new URL(path, `${baseUrl}/`).toString();
}

function resolveEntityImage(value: string | null | undefined, baseUrl: string) {
  return absoluteUrl(value, baseUrl);
}

function safeDescription(...values: Array<string | null | undefined>) {
  return firstNonEmpty(...values);
}

export function stringifyJsonLd(data: JsonLdValue) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function buildOrganizationSchema({
  seo,
  settings,
}: {
  seo: SeoMetadataResult;
  settings: PublicSettings;
}) {
  const baseUrl = resolveBaseUrl(seo.siteUrl);
  const organizationId = `${baseUrl}/#organization`;
  const websiteId = `${baseUrl}/#website`;
  const name = firstNonEmpty(settings.companyName, seo.siteName) ?? seo.siteName;
  const description = safeDescription(settings.description, seo.description);
  const logo = resolveEntityImage(settings.logo, baseUrl);
  const image = resolveEntityImage(settings.heroImage, baseUrl) ?? logo;
  const sameAs = buildSameAs(settings);
  const address = buildAddress(settings);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "GeneralContractor"],
        "@id": organizationId,
        name,
        url: baseUrl,
        ...(logo ? { logo } : {}),
        ...(image ? { image } : {}),
        ...(description ? { description } : {}),
        ...(normalizeText(settings.phone) ? { telephone: normalizeText(settings.phone) } : {}),
        ...(normalizeText(settings.email) ? { email: normalizeText(settings.email) } : {}),
        ...(address ? { address } : {}),
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: baseUrl,
        name,
        ...(description ? { description } : {}),
        publisher: { "@id": organizationId },
      },
    ],
  };
}

export function buildWebsiteSchema({
  seo,
  settings,
}: {
  seo: SeoMetadataResult;
  settings: PublicSettings;
}) {
  return buildOrganizationSchema({ seo, settings });
}

export function buildProjectSchema({
  seo,
  project,
}: {
  seo: SeoMetadataResult;
  project: ProjectSchemaSource;
}) {
  const baseUrl = resolveBaseUrl(seo.siteUrl);
  const canonicalUrl = project.canonicalUrl
    ? absoluteUrl(project.canonicalUrl, baseUrl) ?? resolveCanonicalUrl(baseUrl, `/projects/${project.slug}`)
    : resolveCanonicalUrl(baseUrl, `/projects/${project.slug}`);
  const description = safeDescription(project.seoDescription, project.description, seo.description);
  const name = firstNonEmpty(project.seoTitle, project.title, seo.title) ?? project.title;
  const image =
    resolveEntityImage(project.coverImage, baseUrl) ??
    resolveEntityImage(project.gallery[0]?.image ?? null, baseUrl);

  return {
    "@context": "https://schema.org",
    "@type": "Project",
    "@id": `${canonicalUrl}#project`,
    name,
    url: canonicalUrl,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(project.createdAt ? { dateCreated: project.createdAt.toISOString() } : {}),
    ...(project.updatedAt ? { dateModified: project.updatedAt.toISOString() } : {}),
  };
}

export function buildServiceSchema({
  seo,
  service,
}: {
  seo: SeoMetadataResult;
  service: ServiceSchemaSource;
}) {
  const baseUrl = resolveBaseUrl(seo.siteUrl);
  const canonicalUrl = service.canonicalUrl
    ? absoluteUrl(service.canonicalUrl, baseUrl) ?? resolveCanonicalUrl(baseUrl, `/services/${service.slug}`)
    : resolveCanonicalUrl(baseUrl, `/services/${service.slug}`);
  const name = firstNonEmpty(service.seoTitle, service.title, seo.title) ?? service.title;
  const description = safeDescription(
    service.seoDescription,
    service.shortDescription,
    service.description,
    seo.description
  );
  const image = resolveEntityImage(service.image, baseUrl);

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonicalUrl}#service`,
    name,
    url: canonicalUrl,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    provider: { "@id": `${baseUrl}/#organization` },
  };
}

export function buildBreadcrumbSchema({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
