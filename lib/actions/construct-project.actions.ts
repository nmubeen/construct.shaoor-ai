"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { enforceConstructNumericLimit } from "@/lib/control/construct-subscription.service";

const optionalUrl = z.union([z.literal(""), z.string().url("Must be a valid URL.")]).transform((v) => v || null);
// Zod's default messages ("Too small: expected string to have >=2
// characters") don't name the field — every constraint a user could
// actually trip gets an explicit, labeled message instead.
const schema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(160, "Title must be 160 characters or fewer."), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers and hyphens only."),
  category: z.string().trim().min(2, "Category must be at least 2 characters.").max(100, "Category must be 100 characters or fewer."), status: z.string().trim().min(2, "Status must be at least 2 characters.").max(60, "Status must be 60 characters or fewer."), client: z.string().trim().max(160, "Client must be 160 characters or fewer."), location: z.string().trim().max(160, "Location must be 160 characters or fewer."),
  year: z.coerce.number().int("Year must be a whole number.").min(1800, "Year must be 1800 or later.").max(2200, "Year must be 2200 or earlier."), duration: z.string().trim().max(80, "Duration must be 80 characters or fewer."), budget: z.string().trim().max(80, "Budget must be 80 characters or fewer."), area: z.string().trim().max(80, "Area must be 80 characters or fewer."),
  coverImageUrl: optionalUrl, description: z.string().trim().min(20, "Description must be at least 20 characters.").max(20000, "Description must be 20,000 characters or fewer."), displayFeatured: z.string().optional(),
  seoTitle: z.string().trim().max(160, "SEO title must be 160 characters or fewer.").transform(v => v || null), seoDescription: z.string().trim().max(320, "SEO description must be 320 characters or fewer.").transform(v => v || null), seoKeywords: z.string().trim().max(500, "Keywords must be 500 characters or fewer.").transform(v => v || null), canonicalUrl: optionalUrl,
});

const lines = (value: FormDataEntryValue | null) => String(value ?? "").split(/\r?\n/).map(v => v.trim()).filter(Boolean);

// Bound with useActionState, not a plain <form action> — see the matching
// comment in construct-service.actions.ts: returning an error here instead
// of redirecting to "?error=..." means a failed save doesn't navigate, so
// the form never remounts and nothing the user typed gets wiped.
export type SaveProjectState = { error: string } | null;

export async function saveConstructProjectAction(_prevState: SaveProjectState, formData: FormData): Promise<SaveProjectState> {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") return { error: "You do not have permission to manage projects." };
  const id = String(formData.get("id") ?? "").trim();
  const raw = Object.fromEntries(Object.keys(schema.shape).map(key => [key, String(formData.get(key) ?? "")]));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid project." };
  const { displayFeatured, ...data } = parsed.data;
  const highlights = lines(formData.get("highlights"));
  const galleryUrls = lines(formData.get("galleryUrls"));
  const invalidGallery = galleryUrls.find(url => !z.string().url().safeParse(url).success);
  if (invalidGallery) return { error: `Invalid gallery URL: ${invalidGallery}` };
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
    return { error: message };
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
