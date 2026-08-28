"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { CONSTRUCT_SEO_PAGES, ensureConstructSeoDefaults } from "@/lib/services/construct-seo.service";

const optional = (max: number) => z.string().trim().max(max).transform(value => value || null);
const optionalUrl = z.union([z.literal(""), z.string().url()]).transform(value => value || null);
const optionalUrlOrPath = z.string().trim().max(500).refine(value => !value || value.startsWith("/") || z.string().url().safeParse(value).success, "Enter a valid URL or root-relative path.").transform(value => value || null);
const settingsSchema = z.object({ siteName: z.string().trim().min(2).max(120), defaultTitle: z.string().trim().min(2).max(160), defaultDescription: z.string().trim().min(20).max(320), defaultKeywords: optional(500), siteUrl: z.string().url().max(500), defaultOgImageUrl: optionalUrlOrPath, faviconUrl: optionalUrlOrPath, appleTouchIconUrl: optionalUrlOrPath, twitterHandle: optional(100), facebookAppId: optional(100), googleVerification: optional(255), bingVerification: optional(255) });
const pageSchema = z.object({ pageKey: z.string(), title: z.string().trim().min(2).max(160), description: z.string().trim().min(20).max(320), keywords: optional(500), canonicalUrl: optionalUrl, ogTitle: optional(160), ogDescription: optional(320), ogImageUrl: optionalUrlOrPath });
function requireEditor(role: string) { if (role === "VIEWER") redirect("/dashboard/seo?error=Viewers cannot update SEO settings."); }
const values = (formData: FormData, keys: readonly string[]) => Object.fromEntries(keys.map(key => [key, String(formData.get(key) ?? "")]));

export async function updateConstructSeoSettingsAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireEditor(context.role); await ensureConstructSeoDefaults(context.organizationId);
  const parsed = settingsSchema.safeParse(values(formData, Object.keys(settingsSchema.shape))); if (!parsed.success) redirect(`/dashboard/seo?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid SEO settings.")}`);
  const robotsIndex = formData.get("robotsIndex") === "on"; const robotsFollow = formData.get("robotsFollow") === "on"; const prisma = getConstructPrisma();
  await prisma.$transaction([
    prisma.seoSettings.update({ where: { organizationId: context.organizationId }, data: { ...parsed.data, robotsIndex, robotsFollow } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "seo", action: "settings_update", recordId: context.organizationId, title: "Global SEO settings updated", details: { siteUrl: parsed.data.siteUrl, robotsIndex, robotsFollow } } }),
  ]);
  revalidatePath("/", "layout"); revalidatePath("/sitemap.xml"); revalidatePath("/robots.txt"); redirect("/dashboard/seo?saved=settings");
}

export async function updateConstructSeoPageAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireEditor(context.role); await ensureConstructSeoDefaults(context.organizationId);
  const parsed = pageSchema.safeParse(values(formData, Object.keys(pageSchema.shape))); if (!parsed.success) redirect(`/dashboard/seo?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid page SEO settings.")}`);
  const definition = CONSTRUCT_SEO_PAGES.find(page => page.pageKey === parsed.data.pageKey); if (!definition) redirect("/dashboard/seo?error=Unknown website page.");
  const { pageKey, ...data } = parsed.data; const robotsIndex = formData.get("robotsIndex") === "on"; const robotsFollow = formData.get("robotsFollow") === "on"; const prisma = getConstructPrisma();
  const page = await prisma.seoPage.findUnique({ where: { organizationId_pageKey: { organizationId: context.organizationId, pageKey } }, select: { id: true } }); if (!page) redirect("/dashboard/seo?error=Page SEO record not found.");
  await prisma.$transaction([
    prisma.seoPage.update({ where: { id: page.id }, data: { ...data, robotsIndex, robotsFollow } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "seo", action: "page_update", recordId: page.id, title: `SEO updated: ${definition.pageName}`, details: { pageKey, robotsIndex, robotsFollow } } }),
  ]);
  revalidatePath(definition.path); revalidatePath("/sitemap.xml"); redirect(`/dashboard/seo?saved=${encodeURIComponent(pageKey)}`);
}
