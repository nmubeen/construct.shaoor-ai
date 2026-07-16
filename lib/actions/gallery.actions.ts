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

  await syncProjectCoverImage(projectId);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
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
  await syncProjectCoverImage(image.projectId);
  await deleteUploadedFile(image.image);

  revalidatePath(`/admin/projects/${image.projectId}`);
}

export async function setProjectCoverImage(
  projectId: number,
  image: string
) {
  console.log("========== SET COVER ==========");
  console.log("Project:", projectId);
  console.log("Image:", image);

  const before = await prisma.project.findUnique({
    where: { id: projectId },
  });

  console.log("Before:", before?.coverImage);

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      coverImage: image,
    },
  });

  console.log("After:", updated.coverImage);

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

  // No gallery images → use default
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

  // Is current cover still in gallery?
  const coverExists = project.gallery.some(
    (img) => img.image === project.coverImage
  );

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