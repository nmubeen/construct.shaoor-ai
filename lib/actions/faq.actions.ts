"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/actions/audit.actions";

import {
  stringValue,
  optionalValue,
  numberValue,
  booleanValue,
} from "@/lib/actions/helpers/form.helpers";

function faqDataFromForm(formData: FormData) {
  return {
    question: stringValue(formData, "question"),
    answer: stringValue(formData, "answer"),
    category: optionalValue(formData, "category"),
    displayOrder: numberValue(formData, "displayOrder"),
    featured: booleanValue(formData, "featured"),
    active: booleanValue(formData, "active"),
  };
}

export async function createFAQ(formData: FormData) {
  const faq = await prisma.fAQ.create({
    data: faqDataFromForm(formData),
  });

  await logActivity({
    module: "FAQ",
    action: "CREATE",
    recordId: String(faq.id),
    title: `Created FAQ: ${faq.question}`,
    details: faq.category ? `Category: ${faq.category}` : null,
  });

  revalidatePath("/admin/faq");
  revalidatePath("/faq");

}

export async function updateFAQ(
  id: number,
  formData: FormData
) {
  const existing = await prisma.fAQ.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw new Error("FAQ not found.");
  }

  const updatedFaq = await prisma.fAQ.update({
    where: {
      id,
    },
    data: faqDataFromForm(formData),
  });

  await logActivity({
    module: "FAQ",
    action: "UPDATE",
    recordId: String(updatedFaq.id),
    title: `Updated FAQ: ${updatedFaq.question}`,
    details: updatedFaq.category ? `Category: ${updatedFaq.category}` : null,
  });

  revalidatePath("/admin/faq");
  revalidatePath(`/admin/faq/${id}`);
  revalidatePath("/faq");

}

export async function deleteFAQ(id: number) {
  const faq = await prisma.fAQ.findUnique({
    where: {
      id,
    },
  });

  if (!faq) {
    throw new Error("FAQ not found.");
  }

  await prisma.fAQ.delete({
    where: {
      id,
    },
  });

  await logActivity({
    module: "FAQ",
    action: "DELETE",
    recordId: String(faq.id),
    title: `Deleted FAQ: ${faq.question}`,
    details: faq.category ? `Category: ${faq.category}` : null,
  });

  revalidatePath("/admin/faq");
  revalidatePath("/faq");

}

export async function getFAQs() {
  return prisma.fAQ.findMany({
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

export async function getFAQ(id: number) {
  return prisma.fAQ.findUnique({
    where: {
      id,
    },
  });
}
