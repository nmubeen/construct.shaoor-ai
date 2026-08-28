"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logActivity } from "@/lib/actions/audit.actions";
import { prisma } from "@/lib/prisma";
import { ensureSeoTablesAreCompatible } from "@/lib/seo-repair";
import { getSiteSettings } from "@/lib/settings";
import { getTenantContext } from "@/lib/tenant";

const SEO_PAGE_DEFAULTS = [
  { pageKey: "home", pageName: "Home" },
  { pageKey: "about", pageName: "About" },
  { pageKey: "services", pageName: "Services" },
  { pageKey: "projects", pageName: "Projects" },
  { pageKey: "team", pageName: "Team" },
  { pageKey: "clients", pageName: "Clients" },
  { pageKey: "testimonials", pageName: "Testimonials" },
  { pageKey: "faq", pageName: "FAQ" },
  { pageKey: "contact", pageName: "Contact" },
] as const;

const optionalString = z
  .string()
  .trim()
  .max(500, "Value is too long.")
  .nullable();

const optionalUrl = z
  .string()
  .trim()
  .url("Please enter a valid URL.")
  .max(500, "URL is too long.")
  .nullable();

const optionalUrlOrPath = z
  .string()
  .trim()
  .max(500, "URL is too long.")
  .refine(
    (value) => value.startsWith("/") || z.string().url().safeParse(value).success,
    "Please enter a valid URL."
  )
  .nullable();

const seoSettingsSchema = z.object({
  siteName: z
    .string()
    .trim()
    .min(1, "Site Name is required.")
    .max(120, "Site Name is too long."),
  defaultTitle: z
    .string()
    .trim()
    .min(1, "Default Title is required.")
    .max(120, "Default Title is too long."),
  defaultDescription: z
    .string()
    .trim()
    .min(1, "Default Description is required.")
    .max(320, "Default Description is too long."),
  defaultKeywords: optionalString,
  siteUrl: z
    .string()
    .trim()
    .url("Site URL must be a valid URL.")
    .max(500, "Site URL is too long."),
  defaultOgImage: optionalUrlOrPath,
  favicon: optionalUrlOrPath,
  appleTouchIcon: optionalUrlOrPath,
  twitterHandle: z
    .string()
    .trim()
    .max(100, "Twitter Handle is too long.")
    .nullable(),
  facebookAppId: z
    .string()
    .trim()
    .max(100, "Facebook App ID is too long.")
    .nullable(),
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  googleVerification: z
    .string()
    .trim()
    .max(255, "Google Verification is too long.")
    .nullable(),
  bingVerification: z
    .string()
    .trim()
    .max(255, "Bing Verification is too long.")
    .nullable(),
});

const seoPageSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title is too long."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(320, "Description is too long."),
  keywords: optionalString,
  canonicalUrl: optionalUrl,
  ogTitle: z
    .string()
    .trim()
    .max(120, "OG Title is too long.")
    .nullable(),
  ogDescription: z
    .string()
    .trim()
    .max(320, "OG Description is too long.")
    .nullable(),
  ogImage: optionalUrlOrPath,
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
});

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalValue(formData: FormData, key: string) {
  const value = textValue(formData, key);
  return value === "" ? null : value;
}

function boolValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function validationError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form values.";
}

function pageHref(pageKey: string) {
  return pageKey === "home" ? "/" : `/${pageKey}`;
}

export async function ensureSeoDefaults() {
  await ensureSeoTablesAreCompatible();

  const { companyId } = await getTenantContext();
  const existingSettings = await prisma.seoSettings.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  const appSettings = await getSiteSettings();

  const settings =
    existingSettings ??
    (await prisma.seoSettings.create({
      data: {
        siteName: appSettings.companyName,
        defaultTitle: appSettings.seoTitle || appSettings.companyName,
        defaultDescription:
          appSettings.seoDescription ??
          "Professional construction company delivering quality projects.",
        defaultKeywords: appSettings.seoKeywords ?? null,
        siteUrl: appSettings.website || "https://example.com",
        favicon: appSettings.favicon ?? null,
      },
    }));

  await Promise.all(
    SEO_PAGE_DEFAULTS.map((item) =>
      prisma.seoPage.upsert({
        where: {
          companyId_pageKey: { companyId, pageKey: item.pageKey },
        },
        update: {},
        create: {
          pageKey: item.pageKey,
          pageName: item.pageName,
          title: `${item.pageName} | ${settings.siteName}`,
          description: settings.defaultDescription,
          keywords: settings.defaultKeywords,
          canonicalUrl: `${settings.siteUrl}${pageHref(item.pageKey)}`,
          ogTitle: `${item.pageName} | ${settings.siteName}`,
          ogDescription: settings.defaultDescription,
          ogImage: settings.defaultOgImage,
          robotsIndex: settings.robotsIndex,
          robotsFollow: settings.robotsFollow,
        },
      })
    )
  );
}

export async function getSeoSettings() {
  await ensureSeoTablesAreCompatible();

  await ensureSeoDefaults();

  const settings = await prisma.seoSettings.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!settings) {
    throw new Error("SEO settings not found.");
  }

  return settings;
}

export async function updateSeoSettings(formData: FormData) {
  const settings = await getSeoSettings();

  const parsed = seoSettingsSchema.safeParse({
    siteName: textValue(formData, "siteName"),
    defaultTitle: textValue(formData, "defaultTitle"),
    defaultDescription: textValue(formData, "defaultDescription"),
    defaultKeywords: optionalValue(formData, "defaultKeywords"),
    siteUrl: textValue(formData, "siteUrl"),
    defaultOgImage: optionalValue(formData, "defaultOgImage"),
    favicon: optionalValue(formData, "favicon"),
    appleTouchIcon: optionalValue(formData, "appleTouchIcon"),
    twitterHandle: optionalValue(formData, "twitterHandle"),
    facebookAppId: optionalValue(formData, "facebookAppId"),
    robotsIndex: boolValue(formData, "robotsIndex"),
    robotsFollow: boolValue(formData, "robotsFollow"),
    googleVerification: optionalValue(formData, "googleVerification"),
    bingVerification: optionalValue(formData, "bingVerification"),
  });

  if (!parsed.success) {
    throw new Error(validationError(parsed.error));
  }

  const updatedSettings = await prisma.seoSettings.update({
    where: {
      id: settings.id,
    },
    data: parsed.data,
  });

  await logActivity({
    module: "SEO",
    action: "UPDATE",
    recordId: String(updatedSettings.id),
    title: "Updated SEO Settings",
    details: `Site: ${updatedSettings.siteName}`,
  });

  revalidatePath("/admin/seo");
  revalidatePath("/admin/seo/settings");
}

export async function getSeoPages() {
  await ensureSeoTablesAreCompatible();

  await ensureSeoDefaults();

  return prisma.seoPage.findMany({
    orderBy: {
      pageName: "asc",
    },
  });
}

export async function getSeoPage(pageKey: string) {
  await ensureSeoDefaults();

  return prisma.seoPage.findFirst({
    where: {
      pageKey,
    },
  });
}

export async function updateSeoPage(
  pageKey: string,
  formData: FormData
) {
  const existing = await prisma.seoPage.findFirst({
    where: {
      pageKey,
    },
  });

  if (!existing) {
    throw new Error("SEO page not found.");
  }

  const parsed = seoPageSchema.safeParse({
    title: textValue(formData, "title"),
    description: textValue(formData, "description"),
    keywords: optionalValue(formData, "keywords"),
    canonicalUrl: optionalValue(formData, "canonicalUrl"),
    ogTitle: optionalValue(formData, "ogTitle"),
    ogDescription: optionalValue(formData, "ogDescription"),
    ogImage: optionalValue(formData, "ogImage"),
    robotsIndex: boolValue(formData, "robotsIndex"),
    robotsFollow: boolValue(formData, "robotsFollow"),
  });

  if (!parsed.success) {
    throw new Error(validationError(parsed.error));
  }

  const updatedPage = await prisma.seoPage.update({
    where: {
      id: existing.id,
    },
    data: parsed.data,
  });

  await logActivity({
    module: "SEO",
    action: "UPDATE",
    recordId: String(updatedPage.id),
    title: `Updated SEO Page: ${updatedPage.pageName}`,
    details: `Path: ${pageHref(pageKey)}`,
  });

  revalidatePath("/admin/seo");
  revalidatePath(`/admin/seo/${pageKey}`);
  revalidatePath(pageHref(pageKey));
}
