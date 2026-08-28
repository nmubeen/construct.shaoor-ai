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

function teamDataFromForm(formData: FormData) {
  return {
    name: stringValue(formData, "name"),

    slug: stringValue(formData, "slug"),

    designation: stringValue(formData, "designation"),

    shortBio: stringValue(formData, "shortBio"),

    photo: stringValue(formData, "photo") || "",

    email: optionalValue(formData, "email"),

    phone: optionalValue(formData, "phone"),

    linkedin: optionalValue(formData, "linkedin"),

    instagram: optionalValue(formData, "instagram"),

    twitter: optionalValue(formData, "twitter"),

    displayOrder: numberValue(formData, "displayOrder"),

    showOnHomepage: booleanValue(formData, "showOnHomepage"),

    isActive: booleanValue(formData, "isActive"),

    seoTitle: optionalValue(formData, "seoTitle"),

    seoDescription: optionalValue(formData, "seoDescription"),

    seoKeywords: optionalValue(formData, "seoKeywords"),

    canonicalUrl: optionalValue(formData, "canonicalUrl"),
  };
}

export async function createTeamMember(formData: FormData) {
  const member = await prisma.teamMember.create({
    data: teamDataFromForm(formData),
  });

  await logActivity({
    module: "Team",
    action: "CREATE",
    recordId: String(member.id),
    title: `Created Team Member: ${member.name}`,
    details: `Slug: ${member.slug}`,
  });

  revalidatePath("/admin/team");
  revalidatePath("/team");
  revalidatePath("/");
}

export async function updateTeamMember(id: number, formData: FormData) {
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      id,
    },
  });

  if (!existingMember) {
    throw new Error("Team member not found.");
  }

  const data = teamDataFromForm(formData);

  const previousPhoto = existingMember.photo;

  const updatedMember = await prisma.teamMember.update({
    where: {
      id,
    },
    data: {
      ...data,
      photo: data.photo || previousPhoto,
    },
  });

  if (previousPhoto && updatedMember.photo !== previousPhoto) {
    await deleteFileIfOrphaned(previousPhoto);
  }

  await logActivity({
    module: "Team",
    action: "UPDATE",
    recordId: String(updatedMember.id),
    title: `Updated Team Member: ${updatedMember.name}`,
    details: `Slug: ${updatedMember.slug}`,
  });

  revalidatePath("/admin/team");
  revalidatePath(`/admin/team/${id}`);
  revalidatePath("/team");
  revalidatePath("/");
}

export async function deleteTeamMember(id: number) {
  const member = await prisma.teamMember.findUnique({
    where: {
      id,
    },
  });

  if (!member) {
    throw new Error("Team member not found.");
  }

  await prisma.teamMember.delete({
    where: {
      id,
    },
  });

  if (member.photo) {
    await deleteFileIfOrphaned(member.photo);
  }

  await logActivity({
    module: "Team",
    action: "DELETE",
    recordId: String(member.id),
    title: `Deleted Team Member: ${member.name}`,
    details: `Slug: ${member.slug}`,
  });

  revalidatePath("/admin/team");
  revalidatePath("/team");
  revalidatePath("/");
}

export async function getTeamMembers() {
  return prisma.teamMember.findMany({
    orderBy: {
      displayOrder: "asc",
    },
  });
}

export async function getTeamMember(id: number) {
  return prisma.teamMember.findFirst({
    where: {
      id,
    },
  });
}

export async function getTeamMemberBySlug(slug: string) {
  return prisma.teamMember.findFirst({
    where: {
      slug,
    },
  });
}
