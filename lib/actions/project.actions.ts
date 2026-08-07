"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/actions/audit.actions";
import { deleteFileIfOrphaned } from "@/lib/actions/helpers/media-file.helpers";

function projectDataFromForm(formData: FormData) {
  const coverImageValue = String(
    formData.get("coverImage") ?? ""
  ).trim();

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
    coverImage:
      coverImageValue === ""
        ? null
        : coverImageValue,

    description: formData.get("description") as string,

    featured: formData.get("featured") === "on",

    seoTitle: formData.get("seoTitle") as string,
    seoDescription: formData.get("seoDescription") as string,
    seoKeywords: formData.get("seoKeywords") as string,
    canonicalUrl: formData.get("canonicalUrl") as string,
  };
}

export async function createProject(formData: FormData) {
  const project = await prisma.project.create({
    data: projectDataFromForm(formData),
  });

  await logActivity({
    module: "Projects",
    action: "CREATE",
    recordId: String(project.id),
    title: `Created Project: ${project.title}`,
    details: `Slug: ${project.slug}`,
  });

  revalidatePath("/admin/projects");

}

export async function updateProject(
  id: number,
  formData: FormData
) {
  const existingProject =
    await prisma.project.findUnique({
      where: {
        id,
      },
    });

  if (!existingProject) {
    throw new Error("Project not found.");
  }

  const previousImage =
    existingProject.coverImage;

  const updatedProject =
    await prisma.project.update({
      where: {
        id,
      },
      data: projectDataFromForm(formData),
    });

  if (
    previousImage &&
    previousImage !== updatedProject.coverImage
  ) {
    await deleteFileIfOrphaned(previousImage);
  }

  await logActivity({
    module: "Projects",
    action: "UPDATE",
    recordId: String(updatedProject.id),
    title: `Updated Project: ${updatedProject.title}`,
    details: `Slug: ${updatedProject.slug}`,
  });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);

}

export async function deleteProject(id: number) {
  const project =
    await prisma.project.findUnique({
      where: {
        id,
      },
    });

  if (!project) {
    return {
      success: false,
      message: "Project not found.",
    };
  }

  await prisma.project.delete({
    where: {
      id,
    },
  });

  if (project.coverImage) {
    await deleteFileIfOrphaned(
      project.coverImage
    );
  }

  await logActivity({
    module: "Projects",
    action: "DELETE",
    recordId: String(project.id),
    title: `Deleted Project: ${project.title}`,
    details: `Slug: ${project.slug}`,
  });

  revalidatePath("/admin/projects");

  return {
    success: true,
    message: "Project deleted successfully.",
  };
}
