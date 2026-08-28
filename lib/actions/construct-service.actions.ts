"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

const serviceSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens for the slug."),
  shortDescription: z.string().trim().min(10).max(300),
  description: z.string().trim().min(20).max(10000),
  imageUrl: z.union([z.literal(""), z.string().url()]).transform((value) => value || null),
  icon: z.string().trim().max(80).transform((value) => value || null),
  displayOrder: z.coerce.number().int().min(0).max(10000),
  seoTitle: z.string().trim().max(160).transform((value) => value || null),
  seoDescription: z.string().trim().max(320).transform((value) => value || null),
  seoKeywords: z.string().trim().max(500).transform((value) => value || null),
  canonicalUrl: z.union([z.literal(""), z.string().url()]).transform((value) => value || null),
});

function requireEditor(role: string) {
  if (role === "VIEWER") redirect("/dashboard/services?error=You do not have permission to manage services.");
}

export async function saveConstructServiceAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const id = String(formData.get("id") ?? "").trim();
  const raw = Object.fromEntries(Object.keys(serviceSchema.shape).map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = serviceSchema.safeParse(raw);
  const back = id ? `/dashboard/services/${id}` : "/dashboard/services/new";
  if (!parsed.success) redirect(`${back}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid service.")}`);

  const prisma = getConstructPrisma();
  try {
    if (id) {
      const updated = await prisma.service.updateMany({ where: { id, organizationId: context.organizationId }, data: parsed.data });
      if (updated.count !== 1) redirect("/dashboard/services?error=Service not found.");
      await prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "services", action: "update", recordId: id, title: `Service updated: ${parsed.data.title}` } });
    } else {
      const service = await prisma.service.create({ data: { ...parsed.data, organizationId: context.organizationId, isActive: true } });
      await prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "services", action: "create", recordId: service.id, title: `Service created: ${service.title}` } });
    }
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Unique constraint") ? "That service slug is already in use." : "The service could not be saved.";
    redirect(`${back}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/dashboard"); revalidatePath("/dashboard/services");
  redirect("/dashboard/services?saved=1");
}

export async function toggleConstructServiceAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireEditor(context.role);
  const id = String(formData.get("id") ?? "");
  const service = await getConstructPrisma().service.findFirst({ where: { id, organizationId: context.organizationId }, select: { isActive: true } });
  if (!service) redirect("/dashboard/services?error=Service not found.");
  await getConstructPrisma().service.update({ where: { id }, data: { isActive: !service.isActive } });
  revalidatePath("/dashboard/services"); redirect("/dashboard/services");
}

export async function deleteConstructServiceAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  if (context.role !== "OWNER" && context.role !== "ADMIN") redirect("/dashboard/services?error=Only Owners and Admins can delete services.");
  const id = String(formData.get("id") ?? "");
  const service = await getConstructPrisma().service.findFirst({ where: { id, organizationId: context.organizationId }, select: { title: true } });
  if (!service) redirect("/dashboard/services?error=Service not found.");
  await getConstructPrisma().$transaction([
    getConstructPrisma().service.delete({ where: { id } }),
    getConstructPrisma().auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "services", action: "delete", recordId: id, title: `Service deleted: ${service.title}` } }),
  ]);
  revalidatePath("/dashboard"); revalidatePath("/dashboard/services"); redirect("/dashboard/services?deleted=1");
}
