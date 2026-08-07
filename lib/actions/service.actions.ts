"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logActivity } from "@/lib/actions/audit.actions";
import { serviceService } from "@/lib/services/service.service";
import { deleteFileIfOrphaned } from "@/lib/actions/helpers/media-file.helpers";

const ServiceSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  slug: z.string().trim().min(1, "Slug is required."),
  shortDescription: z.string().trim().default(""),
  description: z.string().trim().default(""),
  image: z.string().default(""),
  icon: z.string().default(""),
  displayOrder: z.coerce.number().min(0).default(0),
  isActive: z.boolean(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  seoKeywords: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
});

function getText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function getNullable(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? null : value;
}

function getNumber(formData: FormData, name: string) {
  return Number(formData.get(name) ?? 0);
}

function getBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function parseForm(formData: FormData) {
  return ServiceSchema.parse({
    title: getText(formData, "title"),
    slug: getText(formData, "slug"),
    shortDescription: getText(formData, "shortDescription"),
    description: getText(formData, "description"),
    image: getText(formData, "image"),
    icon: getText(formData, "icon"),
    displayOrder: getNumber(formData, "displayOrder"),
    isActive: getBoolean(formData, "isActive"),
    seoTitle: getNullable(formData, "seoTitle"),
    seoDescription: getNullable(formData, "seoDescription"),
    seoKeywords: getNullable(formData, "seoKeywords"),
    canonicalUrl: getNullable(formData, "canonicalUrl"),
  });
}

function revalidate() {
  [
    "/admin/services",
    "/services",
  ].forEach((path) => revalidatePath(path));
}

export async function createService(formData: FormData) {
  const data = parseForm(formData);

  const slugExists = await serviceService.exists(data.slug);

  if (slugExists) {
    throw new Error("A service with this slug already exists.");
  }

  const created = await serviceService.create(data);

  await logActivity({
    module: "Services",
    action: "CREATE",
    recordId: String(created.id),
    title: `Created Service: ${created.title}`,
    details: `Slug: ${created.slug}`,
  });

  revalidate();

}

export async function updateService(
  id: number,
  formData: FormData
) {
  const existing = await serviceService.getById(id);

  if (!existing) {
    throw new Error("Service not found.");
  }

  const data = parseForm(formData);

  const slugExists = await serviceService.exists(
    data.slug,
    id
  );

  if (slugExists) {
    throw new Error("A service with this slug already exists.");
  }

  const previousImage = existing.image;

  const updated = await serviceService.update(id, {
    ...data,
    image: data.image || previousImage || "",
  });

  if (
    previousImage &&
    updated.image !== previousImage
  ) {
    await deleteFileIfOrphaned(previousImage);
  }

  await logActivity({
    module: "Services",
    action: "UPDATE",
    recordId: String(updated.id),
    title: `Updated Service: ${updated.title}`,
    details: `Slug: ${updated.slug}`,
  });

  revalidate();

  revalidatePath(`/admin/services/${id}`);

}

export async function deleteService(id: number) {
  const service = await serviceService.getById(id);

  if (!service) {
    throw new Error("Service not found.");
  }

  await serviceService.delete(id);

  if (service.image) {
    await deleteFileIfOrphaned(service.image);
  }

  await logActivity({
    module: "Services",
    action: "DELETE",
    recordId: String(service.id),
    title: `Deleted Service: ${service.title}`,
    details: `Slug: ${service.slug}`,
  });

  revalidate();

}

export async function getServices() {
  return serviceService.getAll();
}

export async function getService(id: number) {
  return serviceService.getById(id);
}

export async function getServiceBySlug(slug: string) {
  return serviceService.getBySlug(slug);
}
