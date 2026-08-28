"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

const allowedStatuses = new Set(["NEW", "READ", "REPLIED", "ARCHIVED"]);

export async function updateConstructMessageStatusAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") redirect("/dashboard/messages?error=Viewers cannot update enquiries.");
  const id = String(formData.get("id") ?? ""); const status = String(formData.get("status") ?? "");
  if (!allowedStatuses.has(status)) redirect("/dashboard/messages?error=Invalid enquiry status.");
  const prisma = getConstructPrisma();
  const message = await prisma.contactMessage.findFirst({ where: { id, organizationId: context.organizationId }, select: { name: true, status: true } });
  if (!message) redirect("/dashboard/messages?error=Enquiry not found.");
  await prisma.$transaction([
    prisma.contactMessage.update({ where: { id }, data: { status: status as "NEW" | "READ" | "REPLIED" | "ARCHIVED" } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "enquiries", action: "status_update", recordId: id, title: `Enquiry status updated: ${message.name}`, details: { from: message.status, to: status } } }),
  ]);
  revalidatePath("/dashboard/messages"); revalidatePath(`/dashboard/messages/${id}`);
  redirect(`/dashboard/messages/${id}?updated=1`);
}
