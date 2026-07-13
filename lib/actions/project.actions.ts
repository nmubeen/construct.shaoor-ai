"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  await prisma.project.create({
    data: {
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
      coverImage: "/images/projects/default.jpg",
    },
  });

  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function updateProject(
  id: number,
  formData: FormData
) {
  await prisma.project.update({
    where: {
      id,
    },
    data: {
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
    },
  });

  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function deleteProject(id: number) {
  await prisma.project.delete({
    where: {
      id,
    },
  });

  revalidatePath("/admin/projects");

  redirect("/admin/projects");
}