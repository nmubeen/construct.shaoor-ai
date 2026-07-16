"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteUploadedFile } from "@/lib/utils/file";

function serviceDataFromForm(formData: FormData) {
  return {
    title: formData.get("title") as string,

    slug: formData.get("slug") as string,

    shortDescription:
      formData.get("shortDescription") as string,

    description:
      formData.get("description") as string,

    image:
      (formData.get("image") as string) || "",

    icon:
      (formData.get("icon") as string) || "",

    displayOrder:
      Number(formData.get("displayOrder")) || 0,

    isActive:
      formData.get("isActive") === "on",
  };
}

export async function createService(
  formData: FormData
) {
  await prisma.service.create({
    data: serviceDataFromForm(formData),
  });

  revalidatePath("/admin/services");
  revalidatePath("/services");

  redirect("/admin/services");
}

export async function updateService(
  id: string,
  formData: FormData
) {
  const existingService =
    await prisma.service.findUnique({
      where: {
        id,
      },
    });

  if (!existingService) {
    throw new Error("Service not found.");
  }

  const data =
    serviceDataFromForm(formData);

  const previousImage =
    existingService.image;

  const updatedService =
    await prisma.service.update({
      where: {
        id,
      },
      data: {
        ...data,
        image:
          data.image ||
          previousImage,
      },
    });

  if (
    previousImage &&
    updatedService.image !== previousImage
  ) {
    await deleteUploadedFile(previousImage);
  }

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${id}`);
  revalidatePath("/services");

  redirect("/admin/services");
}

export async function deleteService(
  id: string
) {
  const service =
    await prisma.service.findUnique({
      where: {
        id,
      },
    });

  if (!service) {
    throw new Error("Service not found.");
  }

  await prisma.service.delete({
    where: {
      id,
    },
  });

  if (service.image) {
    await deleteUploadedFile(
      service.image
    );
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");

  redirect("/admin/services");
}

export async function getServices() {
  return prisma.service.findMany({
    orderBy: {
      displayOrder: "asc",
    },
  });
}

export async function getService(
  id: string
) {
  return prisma.service.findUnique({
    where: {
      id,
    },
  });
}

export async function getServiceBySlug(
  slug: string
) {
  return prisma.service.findUnique({
    where: {
      slug,
    },
  });
}