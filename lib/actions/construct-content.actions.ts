"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

const nullableText = (max: number) => z.string().trim().max(max).transform(value => value || null);
const nullableUrl = z.union([z.literal(""), z.string().url()]).transform(value => value || null);
const order = z.coerce.number().int().min(0).max(10000);
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens for the slug.");

const teamSchema = z.object({
  name: z.string().trim().min(2).max(120), slug, designation: z.string().trim().min(2).max(160),
  shortBio: z.string().trim().min(10).max(1000), photoUrl: z.string().url(), email: nullableText(254),
  phone: nullableText(50), linkedin: nullableUrl, instagram: nullableUrl, twitter: nullableUrl,
  displayOrder: order, showOnHomepage: z.boolean(), seoTitle: nullableText(160),
  seoDescription: nullableText(320), seoKeywords: nullableText(500), canonicalUrl: nullableUrl,
});
const clientSchema = z.object({
  name: z.string().trim().min(2).max(160), slug, logoUrl: nullableUrl, website: nullableUrl,
  category: nullableText(120), description: nullableText(1000), displayOrder: order, featured: z.boolean(),
});
const testimonialSchema = z.object({
  clientName: z.string().trim().min(2).max(160), company: nullableText(160), designation: nullableText(160),
  photoUrl: nullableUrl, rating: z.coerce.number().int().min(1).max(5), testimonial: z.string().trim().min(10).max(3000),
  projectName: nullableText(160), featured: z.boolean(), displayOrder: order,
});
const faqSchema = z.object({
  question: z.string().trim().min(5).max(500), answer: z.string().trim().min(5).max(5000),
  category: nullableText(120), displayOrder: order, featured: z.boolean(),
});

type Kind = "team" | "client" | "testimonial" | "faq";
const kinds = new Set<Kind>(["team", "client", "testimonial", "faq"]);
function getKind(formData: FormData): Kind {
  const kind = String(formData.get("kind") ?? "") as Kind;
  if (!kinds.has(kind)) redirect("/dashboard/content?error=Invalid content type.");
  return kind;
}
function requireEditor(role: string) { if (role === "VIEWER") redirect("/dashboard/content?error=You do not have permission to manage content."); }
function values(formData: FormData, keys: string[]) { return Object.fromEntries(keys.map(key => [key, String(formData.get(key) ?? "")])); }
function checked(formData: FormData, key: string) { return formData.get(key) === "on"; }
function refresh() { revalidatePath("/dashboard/content"); revalidatePath("/", "layout"); revalidatePath("/team"); }

export async function saveConstructContentAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireEditor(context.role);
  const kind = getKind(formData); const id = String(formData.get("id") ?? "").trim(); const prisma = getConstructPrisma();
  try {
    let recordId = id; let title = "";
    if (kind === "team") {
      const parsed = teamSchema.parse({ ...values(formData, Object.keys(teamSchema.shape)), showOnHomepage: checked(formData, "showOnHomepage") }); title = parsed.name;
      if (id) { const result = await prisma.teamMember.updateMany({ where: { id, organizationId: context.organizationId }, data: parsed }); if (!result.count) throw new Error("NOT_FOUND"); }
      else recordId = (await prisma.teamMember.create({ data: { ...parsed, organizationId: context.organizationId, isActive: true } })).id;
    } else if (kind === "client") {
      const parsed = clientSchema.parse({ ...values(formData, Object.keys(clientSchema.shape)), featured: checked(formData, "featured") }); title = parsed.name;
      if (id) { const result = await prisma.client.updateMany({ where: { id, organizationId: context.organizationId }, data: parsed }); if (!result.count) throw new Error("NOT_FOUND"); }
      else recordId = (await prisma.client.create({ data: { ...parsed, organizationId: context.organizationId, isActive: true } })).id;
    } else if (kind === "testimonial") {
      const parsed = testimonialSchema.parse({ ...values(formData, Object.keys(testimonialSchema.shape)), featured: checked(formData, "featured") }); title = parsed.clientName;
      if (id) { const result = await prisma.testimonial.updateMany({ where: { id, organizationId: context.organizationId }, data: parsed }); if (!result.count) throw new Error("NOT_FOUND"); }
      else recordId = (await prisma.testimonial.create({ data: { ...parsed, organizationId: context.organizationId, isActive: true } })).id;
    } else {
      const parsed = faqSchema.parse({ ...values(formData, Object.keys(faqSchema.shape)), featured: checked(formData, "featured") }); title = parsed.question;
      if (id) { const result = await prisma.faq.updateMany({ where: { id, organizationId: context.organizationId }, data: parsed }); if (!result.count) throw new Error("NOT_FOUND"); }
      else recordId = (await prisma.faq.create({ data: { ...parsed, organizationId: context.organizationId, isActive: true } })).id;
    }
    await prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "content", action: id ? "update" : "create", recordId, title: `${kind} ${id ? "updated" : "created"}: ${title}` } });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error && error.message.includes("Unique constraint") ? "That slug is already in use." : error instanceof Error && error.message === "NOT_FOUND" ? "Content item not found." : "The content item could not be saved.";
    redirect(`/dashboard/content?error=${encodeURIComponent(message ?? "Invalid content.")}`);
  }
  refresh(); redirect(`/dashboard/content?saved=${kind}`);
}

export async function toggleConstructContentAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireEditor(context.role); const kind = getKind(formData); const id = String(formData.get("id") ?? ""); const prisma = getConstructPrisma();
  let current: { isActive: boolean } | null = null;
  if (kind === "team") current = await prisma.teamMember.findFirst({ where: { id, organizationId: context.organizationId }, select: { isActive: true } });
  if (kind === "client") current = await prisma.client.findFirst({ where: { id, organizationId: context.organizationId }, select: { isActive: true } });
  if (kind === "testimonial") current = await prisma.testimonial.findFirst({ where: { id, organizationId: context.organizationId }, select: { isActive: true } });
  if (kind === "faq") current = await prisma.faq.findFirst({ where: { id, organizationId: context.organizationId }, select: { isActive: true } });
  if (!current) redirect("/dashboard/content?error=Content item not found.");
  if (kind === "team") await prisma.teamMember.update({ where: { id }, data: { isActive: !current.isActive } });
  if (kind === "client") await prisma.client.update({ where: { id }, data: { isActive: !current.isActive } });
  if (kind === "testimonial") await prisma.testimonial.update({ where: { id }, data: { isActive: !current.isActive } });
  if (kind === "faq") await prisma.faq.update({ where: { id }, data: { isActive: !current.isActive } });
  await prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "content", action: current.isActive ? "deactivate" : "activate", recordId: id, title: `${kind} ${current.isActive ? "deactivated" : "activated"}` } });
  refresh(); redirect("/dashboard/content");
}

export async function deleteConstructContentAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  if (context.role !== "OWNER" && context.role !== "ADMIN") redirect("/dashboard/content?error=Only Owners and Admins can delete content.");
  const kind = getKind(formData); const id = String(formData.get("id") ?? ""); const prisma = getConstructPrisma();
  let found = false;
  if (kind === "team") found = !!await prisma.teamMember.findFirst({ where: { id, organizationId: context.organizationId }, select: { id: true } });
  if (kind === "client") found = !!await prisma.client.findFirst({ where: { id, organizationId: context.organizationId }, select: { id: true } });
  if (kind === "testimonial") found = !!await prisma.testimonial.findFirst({ where: { id, organizationId: context.organizationId }, select: { id: true } });
  if (kind === "faq") found = !!await prisma.faq.findFirst({ where: { id, organizationId: context.organizationId }, select: { id: true } });
  if (!found) redirect("/dashboard/content?error=Content item not found.");
  await prisma.$transaction(async tx => {
    if (kind === "team") await tx.teamMember.delete({ where: { id } });
    if (kind === "client") await tx.client.delete({ where: { id } });
    if (kind === "testimonial") await tx.testimonial.delete({ where: { id } });
    if (kind === "faq") await tx.faq.delete({ where: { id } });
    await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "content", action: "delete", recordId: id, title: `${kind} deleted` } });
  });
  refresh(); redirect(`/dashboard/content?deleted=${kind}`);
}
