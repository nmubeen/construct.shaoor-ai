"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ensureMessageTableIsCompatible } from "@/lib/actions/message-repair";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { resolvePublicConstructOrganization } from "@/lib/construct-public-tenant";

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40),
  subject: z.string().trim().max(160),
  projectInterest: z.string().trim().max(120),
  message: z.string().trim().min(10).max(5000),
  consent: z.literal("on"),
  companyWebsite: z.string().max(0),
});

export async function submitMessage(formData: FormData) {
  const parsed = enquirySchema.safeParse(Object.fromEntries(["name", "email", "phone", "subject", "projectInterest", "message", "consent", "companyWebsite"].map(key => [key, String(formData.get(key) ?? "")])));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Please check your enquiry details.");
  const data = {
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    subject: parsed.data.subject,
    projectInterest: parsed.data.projectInterest,
    message: parsed.data.message,
  };
  const organization = await resolvePublicConstructOrganization();

  if (organization) {
    const constructPrisma = getConstructPrisma();
    await constructPrisma.$transaction(async tx => {
      const enquiry = await tx.contactMessage.create({ data: { organizationId: organization.id, ...data, phone: data.phone || null, subject: data.subject || null, projectInterest: data.projectInterest || null, consentAt: new Date() } });
      await tx.auditLog.create({ data: { organizationId: organization.id, module: "enquiries", action: "submit", recordId: enquiry.id, title: `New enquiry from ${data.name}`, details: { subject: data.subject || null, projectInterest: data.projectInterest || null } } });
    });
    revalidatePath("/dashboard/messages");
    return;
  }

  await ensureMessageTableIsCompatible();
  await prisma.message.create({ data: { name: data.name, email: data.email, phone: data.phone || null, subject: data.subject || null, message: data.message, projectInterest: data.projectInterest || null } });

  revalidatePath("/admin/messages");
}
