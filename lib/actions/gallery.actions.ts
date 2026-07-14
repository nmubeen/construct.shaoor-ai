"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { deleteUploadedFile } from "@/lib/utils/file";

export async function addGalleryImage(
  projectId: number,
  image: string
) {
  await prisma.gallery.create({
    data: {
      projectId,
      image,
    },
  });

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function getGalleryImages(
  projectId: number
) {
  return prisma.gallery.findMany({
    where: {
      projectId,
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function deleteGalleryImage(
  id: number
) {
  const image = await prisma.gallery.findUnique({
    where: {
      id,
    },
  });

  if (!image) {
    throw new Error("Gallery image not found.");
  }

  await prisma.gallery.delete({
    where: {
      id,
    },
  });

  await deleteUploadedFile(image.image);

  revalidatePath(`/admin/projects/${image.projectId}`);
}