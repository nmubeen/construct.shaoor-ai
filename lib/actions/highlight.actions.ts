"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addHighlight(
  projectId: number,
  text: string
) {
  const value = text.trim();

  if (!value) {
    throw new Error("Highlight cannot be empty.");
  }

  await prisma.highlight.create({
    data: {
      projectId,
      text: value,
    },
  });

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function deleteHighlight(
  id: number
) {
  const highlight =
    await prisma.highlight.findUnique({
      where: {
        id,
      },
    });

  if (!highlight) {
    throw new Error("Highlight not found.");
  }

  await prisma.highlight.delete({
    where: {
      id,
    },
  });

  revalidatePath(
    `/admin/projects/${highlight.projectId}`
  );
}