"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { deleteFileIfOrphaned } from "@/lib/actions/helpers/media-file.helpers";

export async function addProjectGalleryImage(projectId: number, image: string) {
  await prisma.projectGallery.create({
    data: {
      projectId,
      image,
    },
  });

  await syncProjectCoverImage(projectId);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
}

export async function getProjectGalleryImages(projectId: number) {
  return prisma.projectGallery.findMany({
    where: {
      projectId,
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function deleteProjectGalleryImage(id: number) {
  const image = await prisma.projectGallery.findUnique({
    where: {
      id,
    },
  });

  if (!image) {
    throw new Error("Gallery image not found.");
  }

  await prisma.projectGallery.delete({
    where: {
      id,
    },
  });

  await syncProjectCoverImage(image.projectId);
  await deleteFileIfOrphaned(image.image);

  revalidatePath(`/admin/projects/${image.projectId}`);
}

export async function setProjectCoverImage(projectId: number, image: string) {
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      coverImage: image,
    },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath(`/projects/${updated.slug}`);
  revalidatePath("/");
}

async function syncProjectCoverImage(projectId: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      gallery: {
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.gallery.length === 0) {
    if (project.coverImage !== "/images/projects/default.jpg") {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          coverImage: "/images/projects/default.jpg",
        },
      });
    }

    return;
  }

  const coverExists = project.gallery.some((img) => img.image === project.coverImage);

  if (!coverExists) {
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        coverImage: project.gallery[0].image,
      },
    });
  }
}
