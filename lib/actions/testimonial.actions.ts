"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/actions/audit.actions";
import { deleteFileIfOrphaned } from "@/lib/actions/helpers/media-file.helpers";

import {
  stringValue,
  optionalValue,
  numberValue,
  booleanValue,
} from "@/lib/actions/helpers/form.helpers";

function testimonialDataFromForm(formData: FormData) {
  return {
    clientName: stringValue(formData, "clientName"),
    company: optionalValue(formData, "company"),
    designation: optionalValue(formData, "designation"),
    photo: optionalValue(formData, "photo"),
    rating: numberValue(formData, "rating"),
    testimonial: stringValue(formData, "testimonial"),
    projectName: optionalValue(formData, "projectName"),
    featured: booleanValue(formData, "featured"),
    active: booleanValue(formData, "active"),
    displayOrder: numberValue(formData, "displayOrder"),
  };
}

export async function createTestimonial(formData: FormData) {
  const testimonial = await prisma.testimonial.create({
    data: testimonialDataFromForm(formData),
  });

  await logActivity({
    module: "Testimonials",
    action: "CREATE",
    recordId: String(testimonial.id),
    title: `Created Testimonial: ${testimonial.clientName}`,
    details: testimonial.company ? `Company: ${testimonial.company}` : null,
  });

  revalidatePath("/admin/testimonials");
  revalidatePath("/testimonials");

}

export async function updateTestimonial(
  id: number,
  formData: FormData
) {
  const existing = await prisma.testimonial.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw new Error("Testimonial not found.");
  }

  const data = testimonialDataFromForm(formData);

  const previousPhoto = existing.photo;

  const updated = await prisma.testimonial.update({
    where: {
      id,
    },
    data,
  });

  if (
    previousPhoto &&
    updated.photo !== previousPhoto
  ) {
    await deleteFileIfOrphaned(previousPhoto);
  }

  await logActivity({
    module: "Testimonials",
    action: "UPDATE",
    recordId: String(updated.id),
    title: `Updated Testimonial: ${updated.clientName}`,
    details: updated.company ? `Company: ${updated.company}` : null,
  });

  revalidatePath("/admin/testimonials");
  revalidatePath(`/admin/testimonials/${id}`);
  revalidatePath("/testimonials");

}

export async function deleteTestimonial(id: number) {
  const testimonial = await prisma.testimonial.findUnique({
    where: {
      id,
    },
  });

  if (!testimonial) {
    throw new Error("Testimonial not found.");
  }

  await prisma.testimonial.delete({
    where: {
      id,
    },
  });

  if (testimonial.photo) {
    await deleteFileIfOrphaned(testimonial.photo);
  }

  await logActivity({
    module: "Testimonials",
    action: "DELETE",
    recordId: String(testimonial.id),
    title: `Deleted Testimonial: ${testimonial.clientName}`,
    details: testimonial.company ? `Company: ${testimonial.company}` : null,
  });

  revalidatePath("/admin/testimonials");
  revalidatePath("/testimonials");

}

export async function getTestimonials() {
  return prisma.testimonial.findMany({
    orderBy: [
      {
        displayOrder: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function getTestimonial(id: number) {
  return prisma.testimonial.findUnique({
    where: {
      id,
    },
  });
}
