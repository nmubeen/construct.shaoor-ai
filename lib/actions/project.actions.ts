"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteUploadedFile } from "@/lib/utils/file";

function projectDataFromForm(formData: FormData) {
  return {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    category: formData.get("category") as string,
    status: formData.get("status") as string,
    client: formData.get("client") as string,
    location: formData.get("location") as string,
    year: Number(formData.get("year")),
    duration: formData.get("duration") as string,
    budget: formData.get("budget") as string,
    area: formData.get("area") as string,
    description: formData.get("description") as string,
    featured: formData.get("featured") === "on",
      seoTitle:
  formData.get("seoTitle") as string,

seoDescription:
  formData.get("seoDescription") as string,

seoKeywords:
  formData.get("seoKeywords") as string,

canonicalUrl:
  formData.get("canonicalUrl") as string,
  };
}

export async function createProject(formData: FormData) {
  await prisma.project.create({
    data: projectDataFromForm(formData),
  });

  revalidatePath("/admin/projects");

  redirect("/admin/projects");
}

export async function updateProject(
  id: number,
  formData: FormData
) {
  const existingProject = await prisma.project.findUnique({
    where: {
      id,
    },
  });

  if (!existingProject) {
    throw new Error("Project not found.");
  }

  const data = projectDataFromForm(formData);

  const previousImage = existingProject.coverImage;

  const updatedProject = await prisma.project.update({
    where: {
      id,
    },
    data: {
      ...data,
     },
  });

  // Delete the old image only if it has been replaced
  if (
    previousImage &&
    updatedProject.coverImage !== previousImage
  ) {
    await deleteUploadedFile(previousImage);
  }

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);

  redirect("/admin/projects");
}

export async function deleteProject(id: number) {
  const project = await prisma.project.findUnique({
    where: {
      id,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  await prisma.project.delete({
    where: {
      id,
    },
  });

  // Delete cover image from disk
  await deleteUploadedFile(project.coverImage);

  revalidatePath("/admin/projects");

  redirect("/admin/projects");
}