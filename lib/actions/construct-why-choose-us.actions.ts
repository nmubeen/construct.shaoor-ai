"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { isValidWebsiteIconKey } from "@/lib/website-icons";

// Raw SQL throughout this file: construct.why_choose_us_highlights and
// site_settings.why_choose_us_title/subtitle exist in Postgres but the
// generated client here couldn't be regenerated (dev server holds the
// query engine binary locked on Windows) — switch to typed
// prisma.whyChooseUsHighlight / siteSettings.whyChooseUs* calls once a
// client regen picks them up.

const MAX_HIGHLIGHTS = 8;

function requireEditor(role: string) {
  if (role === "VIEWER") redirect("/dashboard/content?error=You do not have permission to manage content.");
}

const settingsSchema = z.object({
  whyChooseUsTitle: z.string().trim().min(2, "Title must be at least 2 characters.").max(160, "Title must be 160 characters or fewer."),
  whyChooseUsSubtitle: z.string().trim().min(5, "Subtitle must be at least 5 characters.").max(400, "Subtitle must be 400 characters or fewer."),
});

export async function updateConstructWhyChooseUsSettingsAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const parsed = settingsSchema.safeParse({ whyChooseUsTitle: formData.get("whyChooseUsTitle"), whyChooseUsSubtitle: formData.get("whyChooseUsSubtitle") });
  if (!parsed.success) redirect(`/dashboard/content?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid value.")}`);
  const prisma = getConstructPrisma();
  await prisma.$executeRaw`
    UPDATE construct.site_settings SET why_choose_us_title = ${parsed.data.whyChooseUsTitle}, why_choose_us_subtitle = ${parsed.data.whyChooseUsSubtitle}
    WHERE organization_id = ${context.organizationId}::uuid
  `;
  revalidatePath("/dashboard/content"); revalidatePath("/");
  redirect("/dashboard/content?saved=1");
}

const highlightSchema = z.object({
  icon: z.string().refine(isValidWebsiteIconKey, "Choose a valid icon."),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(80, "Title must be 80 characters or fewer."),
  description: z.string().trim().min(10, "Description must be at least 10 characters.").max(240, "Description must be 240 characters or fewer."),
});

export async function createConstructWhyChooseUsHighlightAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const prisma = getConstructPrisma();
  const [{ count }] = await prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS count FROM construct.why_choose_us_highlights WHERE organization_id = ${context.organizationId}::uuid`;
  if (count >= MAX_HIGHLIGHTS) redirect(`/dashboard/content?error=${encodeURIComponent(`Up to ${MAX_HIGHLIGHTS} highlights are supported — delete one first.`)}`);
  const parsed = highlightSchema.safeParse({ icon: formData.get("icon"), title: formData.get("title"), description: formData.get("description") });
  if (!parsed.success) redirect(`/dashboard/content?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid highlight.")}`);
  await prisma.$executeRaw`
    INSERT INTO construct.why_choose_us_highlights (organization_id, icon, title, description, sort_order)
    VALUES (${context.organizationId}::uuid, ${parsed.data.icon}, ${parsed.data.title}, ${parsed.data.description}, ${count})
  `;
  revalidatePath("/dashboard/content"); revalidatePath("/");
  redirect("/dashboard/content?saved=1");
}

export async function updateConstructWhyChooseUsHighlightAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const id = String(formData.get("id") ?? "");
  const parsed = highlightSchema.safeParse({ icon: formData.get("icon"), title: formData.get("title"), description: formData.get("description") });
  if (!parsed.success) redirect(`/dashboard/content?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid highlight.")}`);
  const prisma = getConstructPrisma();
  const result = await prisma.$executeRaw`
    UPDATE construct.why_choose_us_highlights SET icon = ${parsed.data.icon}, title = ${parsed.data.title}, description = ${parsed.data.description}
    WHERE id = ${id}::uuid AND organization_id = ${context.organizationId}::uuid
  `;
  if (result === 0) redirect("/dashboard/content?error=Highlight not found.");
  revalidatePath("/dashboard/content"); revalidatePath("/");
  redirect("/dashboard/content?saved=1");
}

export async function deleteConstructWhyChooseUsHighlightAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const id = String(formData.get("id") ?? "");
  const prisma = getConstructPrisma();
  const result = await prisma.$executeRaw`DELETE FROM construct.why_choose_us_highlights WHERE id = ${id}::uuid AND organization_id = ${context.organizationId}::uuid`;
  if (result === 0) redirect("/dashboard/content?error=Highlight not found.");
  revalidatePath("/dashboard/content"); revalidatePath("/");
  redirect("/dashboard/content?deleted=1");
}
