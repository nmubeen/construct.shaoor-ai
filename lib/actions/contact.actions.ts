"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ensureMessageTableIsCompatible } from "@/lib/actions/message-repair";

export async function submitMessage(formData: FormData) {
  await ensureMessageTableIsCompatible();

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const subject = formData.get("subject")?.toString().trim();
  const projectInterest = formData
    .get("projectInterest")
    ?.toString()
    .trim();
  const message = formData.get("message")?.toString().trim();

  if (!name || !email || !message) {
    throw new Error("Please complete all required fields.");
  }

  await prisma.$executeRaw`
    INSERT INTO "Message" (
      "name",
      "email",
      "phone",
      "subject",
      "message",
      "projectInterest",
      "isRead",
      "isReplied",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${name},
      ${email},
      ${phone ?? null},
      ${subject ?? null},
      ${message},
      ${projectInterest ?? null},
      0,
      0,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
  `;

  revalidatePath("/admin/messages");
}
