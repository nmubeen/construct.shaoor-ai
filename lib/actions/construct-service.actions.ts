"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/construct-client";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { seedConstructDefaultServices } from "@/lib/services/construct-service-seed.service";

// Zod's default messages ("Too small: expected string to have >=10
// characters") don't name the field, so a form with several similarly-
// shaped text fields leaves no way to tell which one failed. Every
// constraint here that a user could actually trip gets an explicit,
// labeled message instead.
const serviceSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(120, "Title must be 120 characters or fewer."),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers and hyphens only."),
  shortDescription: z.string().trim().min(10, "Short description must be at least 10 characters.").max(300, "Short description must be 300 characters or fewer."),
  description: z.string().trim().min(20, "Full description must be at least 20 characters.").max(10000, "Full description must be 10,000 characters or fewer."),
  imageUrl: z.union([z.literal(""), z.string().url("Image URL must be a valid URL.")]).transform((value) => value || null),
  icon: z.string().trim().max(80, "Icon name must be 80 characters or fewer.").transform((value) => value || null),
  displayOrder: z.coerce.number().int("Display order must be a whole number.").min(0, "Display order cannot be negative.").max(10000, "Display order must be 10,000 or less."),
  seoTitle: z.string().trim().max(160, "SEO title must be 160 characters or fewer.").transform((value) => value || null),
  seoDescription: z.string().trim().max(320, "SEO description must be 320 characters or fewer.").transform((value) => value || null),
  seoKeywords: z.string().trim().max(500, "Keywords must be 500 characters or fewer.").transform((value) => value || null),
  canonicalUrl: z.union([z.literal(""), z.string().url("Canonical URL must be a valid URL.")]).transform((value) => value || null),
});

const MAX_SUB_SERVICES = 10;
const lines = (value: FormDataEntryValue | null) => String(value ?? "").split(/\r?\n/).map((v) => v.trim()).filter(Boolean);

function requireEditor(role: string) {
  if (role === "VIEWER") redirect("/dashboard/services?error=You do not have permission to manage services.");
}

// Bound with useActionState, not a plain <form action>: returning an error
// here (instead of redirecting to "?error=...") means a failed save stays
// on the same page without a navigation, so the form never remounts and
// nothing the user typed gets wiped — a redirect always re-renders the
// Server Component tree fresh from the database, which is exactly what
// was clobbering an in-progress edit before. Still redirects on success,
// since there's nothing left to preserve once the save actually lands.
export type SaveServiceState = { error: string } | null;

// Replaces this service's whole sub-services list, same convention as
// ProjectHighlight in saveConstructProjectAction. Written via raw SQL
// rather than the typed client: SubService exists in Postgres (see the
// sub_services migration) but the generated client on this machine
// couldn't be regenerated (the dev server holds its query engine binary
// locked on Windows) — switch to tx.subService.deleteMany/createMany
// once a client regen picks the model up.
async function replaceSubServices(tx: Prisma.TransactionClient, organizationId: string, serviceId: string, items: string[]) {
  await tx.$executeRaw`DELETE FROM construct.sub_services WHERE service_id = ${serviceId}::uuid AND organization_id = ${organizationId}::uuid`;
  for (const [index, text] of items.entries()) {
    await tx.$executeRaw`INSERT INTO construct.sub_services (organization_id, service_id, text, sort_order) VALUES (${organizationId}::uuid, ${serviceId}::uuid, ${text}, ${index})`;
  }
}

export async function saveConstructServiceAction(_prevState: SaveServiceState, formData: FormData): Promise<SaveServiceState> {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") return { error: "You do not have permission to manage services." };
  const id = String(formData.get("id") ?? "").trim();
  const raw = Object.fromEntries(Object.keys(serviceSchema.shape).map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid service." };

  const subServices = lines(formData.get("subServices"));
  if (subServices.length > MAX_SUB_SERVICES) return { error: `You can add up to ${MAX_SUB_SERVICES} sub-services per service.` };
  const tooLong = subServices.find((text) => text.length > 200);
  if (tooLong) return { error: "Each sub-service must be 200 characters or fewer." };

  const prisma = getConstructPrisma();
  try {
    await prisma.$transaction(async (tx) => {
      let serviceId = id;
      if (id) {
        const updated = await tx.service.updateMany({ where: { id, organizationId: context.organizationId }, data: parsed.data });
        if (updated.count !== 1) throw new Error("SERVICE_NOT_FOUND");
        await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "services", action: "update", recordId: id, title: `Service updated: ${parsed.data.title}` } });
      } else {
        const service = await tx.service.create({ data: { ...parsed.data, organizationId: context.organizationId, isActive: true } });
        serviceId = service.id;
        await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "services", action: "create", recordId: service.id, title: `Service created: ${service.title}` } });
      }
      await replaceSubServices(tx, context.organizationId, serviceId, subServices);
    });
  } catch (error) {
    const text = error instanceof Error ? error.message : "";
    const message = text.includes("Unique constraint") ? "That service slug is already in use." : text.includes("SERVICE_NOT_FOUND") ? "Service not found." : "The service could not be saved.";
    return { error: message };
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

// Available only from the empty-state button on /dashboard/services (see
// seedConstructDefaultServices for why there's no persisted "already
// seeded" flag — deleting every service back to zero intentionally makes
// this available again, by design, not as an accidental side effect).
export async function seedConstructDefaultServicesAction() {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const result = await seedConstructDefaultServices(context.organizationId);
  if (!result.seeded) redirect("/dashboard/services?error=Services already exist — seeding is only available for an empty list.");
  await getConstructPrisma().auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "services", action: "seed", recordId: context.organizationId, title: `Seeded ${result.count} default services` } });
  revalidatePath("/dashboard"); revalidatePath("/dashboard/services"); revalidatePath("/dashboard/media");
  redirect(`/dashboard/services?seeded=${result.count}`);
}
