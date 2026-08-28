"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { enforceConstructNumericLimit } from "@/lib/control/construct-subscription.service";

const optionalUrl = z.union([z.literal(""), z.string().url()]).transform((v) => v || null);
const schema = z.object({
  title: z.string().trim().min(2).max(160), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens for the slug."),
  category: z.string().trim().min(2).max(100), status: z.string().trim().min(2).max(60), client: z.string().trim().max(160), location: z.string().trim().max(160),
  year: z.coerce.number().int().min(1800).max(2200), duration: z.string().trim().max(80), budget: z.string().trim().max(80), area: z.string().trim().max(80),
  coverImageUrl: optionalUrl, description: z.string().trim().min(20).max(20000), displayFeatured: z.string().optional(),
  seoTitle: z.string().trim().max(160).transform(v => v || null), seoDescription: z.string().trim().max(320).transform(v => v || null), seoKeywords: z.string().trim().max(500).transform(v => v || null), canonicalUrl: optionalUrl,
});

const lines = (value: FormDataEntryValue | null) => String(value ?? "").split(/\r?\n/).map(v => v.trim()).filter(Boolean);
function requireEditor(role: string) { if (role === "VIEWER") redirect("/dashboard/projects?error=You do not have permission to manage projects."); }

export async function saveConstructProjectAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireEditor(context.role);
  const id = String(formData.get("id") ?? "").trim();
  const raw = Object.fromEntries(Object.keys(schema.shape).map(key => [key, String(formData.get(key) ?? "")]));
  const parsed = schema.safeParse(raw); const back = id ? `/dashboard/projects/${id}` : "/dashboard/projects/new";
  if (!parsed.success) redirect(`${back}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid project.")}`);
  const { displayFeatured, ...data } = parsed.data;
  const highlights = lines(formData.get("highlights"));
  const galleryUrls = lines(formData.get("galleryUrls"));
  const invalidGallery = galleryUrls.find(url => !z.string().url().safeParse(url).success);
  if (invalidGallery) redirect(`${back}?error=${encodeURIComponent(`Invalid gallery URL: ${invalidGallery}`)}`);
  const prisma = getConstructPrisma();
  try {
    if (!id) await enforceConstructNumericLimit(context.organizationId,"MAX_PROJECTS",await prisma.project.count({where:{organizationId:context.organizationId}}));
    await prisma.$transaction(async tx => {
      let projectId = id;
      if (id) {
        const updated = await tx.project.updateMany({ where: { id, organizationId: context.organizationId }, data: { ...data, featured: displayFeatured === "on" } });
        if (updated.count !== 1) throw new Error("PROJECT_NOT_FOUND");
        await tx.projectHighlight.deleteMany({ where: { projectId: id, organizationId: context.organizationId } });
        await tx.projectGalleryItem.deleteMany({ where: { projectId: id, organizationId: context.organizationId } });
      } else {
        const project = await tx.project.create({ data: { ...data, featured: displayFeatured === "on", organizationId: context.organizationId } }); projectId = project.id;
      }
      if (highlights.length) await tx.projectHighlight.createMany({ data: highlights.map((text, sortOrder) => ({ organizationId: context.organizationId, projectId, text, sortOrder })) });
      if (galleryUrls.length) await tx.projectGalleryItem.createMany({ data: galleryUrls.map((imageUrl, sortOrder) => ({ organizationId: context.organizationId, projectId, imageUrl, sortOrder })) });
      await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "projects", action: id ? "update" : "create", recordId: projectId, title: `${id ? "Project updated" : "Project created"}: ${data.title}`, details: { highlights: highlights.length, galleryImages: galleryUrls.length } } });
    });
  } catch (error) {
    const text = error instanceof Error ? error.message : "";
    const message = text.includes("Unique constraint") ? "That project slug is already in use." : text.includes("PROJECT_NOT_FOUND") ? "Project not found." : text || "The project could not be saved.";
    redirect(`${back}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/dashboard"); revalidatePath("/dashboard/projects"); redirect("/dashboard/projects?saved=1");
}

export async function toggleConstructProjectFeaturedAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireEditor(context.role); const id = String(formData.get("id") ?? ""); const prisma = getConstructPrisma();
  const project = await prisma.project.findFirst({ where: { id, organizationId: context.organizationId }, select: { featured: true } }); if (!project) redirect("/dashboard/projects?error=Project not found.");
  await prisma.project.update({ where: { id }, data: { featured: !project.featured } }); revalidatePath("/dashboard/projects"); redirect("/dashboard/projects");
}

export async function deleteConstructProjectAction(formData: FormData) {
  const context = await requireActiveConstructContext(); if (context.role !== "OWNER" && context.role !== "ADMIN") redirect("/dashboard/projects?error=Only Owners and Admins can delete projects.");
  const id = String(formData.get("id") ?? ""); const prisma = getConstructPrisma(); const project = await prisma.project.findFirst({ where: { id, organizationId: context.organizationId }, select: { title: true } }); if (!project) redirect("/dashboard/projects?error=Project not found.");
  await prisma.$transaction([prisma.project.delete({ where: { id } }), prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "projects", action: "delete", recordId: id, title: `Project deleted: ${project.title}` } })]);
  revalidatePath("/dashboard"); revalidatePath("/dashboard/projects"); redirect("/dashboard/projects?deleted=1");
}
