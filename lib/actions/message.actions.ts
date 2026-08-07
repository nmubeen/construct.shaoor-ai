"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/actions/audit.actions";
import { ensureMessageTableIsCompatible } from "@/lib/actions/message-repair";

export async function getMessages() {
  await ensureMessageTableIsCompatible();

  return prisma.message.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getMessage(id: number) {
  await ensureMessageTableIsCompatible();

  return prisma.message.findUnique({
    where: { id },
  });
}

export async function markMessageAsRead(id: number) {
  await ensureMessageTableIsCompatible();

  await prisma.message.update({
    where: { id },
    data: {
      isRead: true,
    },
  });

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${id}`);
}

export async function markMessageAsUnread(id: number) {
  await ensureMessageTableIsCompatible();

  await prisma.message.update({
    where: { id },
    data: {
      isRead: false,
    },
  });

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${id}`);
}

export async function markMessageAsReplied(id: number) {
  await ensureMessageTableIsCompatible();

  const message = await prisma.message.update({
    where: { id },
    data: {
      isReplied: true,
    },
  });

  await logActivity({
    module: "Messages",
    action: "UPDATE",
    recordId: String(message.id),
    title: `Replied to Message: ${message.subject || message.name}`,
    details: `From: ${message.email}`,
  });

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${id}`);
}

export async function deleteMessage(id: number) {
  await ensureMessageTableIsCompatible();

  const message = await prisma.message.delete({
    where: { id },
  });

  await logActivity({
    module: "Messages",
    action: "DELETE",
    recordId: String(message.id),
    title: `Deleted Message: ${message.subject || message.name}`,
    details: `From: ${message.email}`,
  });

  revalidatePath("/admin/messages");
}
