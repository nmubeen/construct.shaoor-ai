"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ensureMessageTableIsCompatible } from "@/lib/actions/message-repair";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { resolvePublicConstructOrganization } from "@/lib/construct-public-tenant";
import { checkAnswer, type AnswerValue, type PublicEnquiryQuestion, type StoredAnswer } from "@/lib/enquiry/questions";
import { getActiveEnquiryQuestions } from "@/lib/services/construct-enquiry-question.service";

// Public enquiry endpoints — the one submission path for every entry point
// (home / services list / service detail modals and the contact page).
// The tenant is always resolved from the request host, never from the
// payload, and questions are re-read from the database here rather than
// trusted from the client.

const CONTACT_METHODS = ["Phone", "WhatsApp", "Email"] as const;
const uuid = z.string().uuid();

const enquirySchema = z.object({
  serviceId: z.string().nullable(),
  subService: z.string().trim().max(200).optional(),
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  phone: z.string().trim().regex(/^\+?[\d\s()\-.]{7,20}$/, "Please enter a valid mobile / WhatsApp number."),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254),
  projectLocation: z.string().trim().min(2, "Please enter the project / site location.").max(200),
  preferredContactMethod: z.enum(CONTACT_METHODS).or(z.literal("")),
  message: z.string().trim().max(5000, "Additional requirements must be 5,000 characters or fewer."),
  consent: z.boolean().refine((value) => value, "Please confirm your consent so we can respond to you."),
  companyWebsite: z.string().max(0),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type EnquiryResult = { ok: true } | { ok: false; error: string };

/** Active questions for one service of the current tenant (empty when none / unknown service). */
export async function getEnquiryQuestionsAction(serviceId: string): Promise<PublicEnquiryQuestion[]> {
  if (!uuid.safeParse(serviceId).success) return [];
  const organization = await resolvePublicConstructOrganization();
  if (!organization) return [];
  return getActiveEnquiryQuestions(organization.id, serviceId);
}

function buildAnswers(questions: PublicEnquiryQuestion[], raw: Record<string, AnswerValue>): { answers: StoredAnswer[] } | { error: string } {
  const answers: StoredAnswer[] = [];
  for (const question of questions) {
    const checked = checkAnswer(question, raw[question.id]);
    if ("error" in checked) return { error: checked.error };
    if (checked.value !== null) answers.push({ questionId: question.id, question: question.questionText, type: question.questionType, answer: checked.value });
  }
  return { answers };
}

export async function submitEnquiryAction(input: EnquiryInput): Promise<EnquiryResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your enquiry details." };
  const data = parsed.data;
  // With no service there are no questions, so the free-text message is the enquiry.
  if (!data.serviceId && data.message.length < 10) return { ok: false, error: "Please tell us a little about your requirement (at least 10 characters)." };

  const organization = await resolvePublicConstructOrganization();

  if (organization) {
    const serviceId = data.serviceId;
    if (serviceId && !uuid.safeParse(serviceId).success) return { ok: false, error: "That service is no longer available." };
    const prisma = getConstructPrisma();
    let service: { id: string; title: string } | null = null;
    let answers: StoredAnswer[] = [];
    let subService: string | null = null;

    if (serviceId) {
      service = await prisma.service.findFirst({ where: { id: serviceId, organizationId: organization.id, isActive: true }, select: { id: true, title: true } });
      if (!service) return { ok: false, error: "That service is no longer available." };
      const built = buildAnswers(await getActiveEnquiryQuestions(organization.id, service.id), data.answers);
      if ("error" in built) return { ok: false, error: built.error };
      answers = built.answers;
      if (data.subService) {
        const match = await prisma.subService.findFirst({ where: { organizationId: organization.id, serviceId: service.id, text: data.subService }, select: { text: true } });
        subService = match?.text ?? null;
      }
    }

    const serviceLabel = service ? (subService ? `${service.title} — ${subService}` : service.title) : "General enquiry";
    await prisma.$transaction(async (tx) => {
      const enquiry = await tx.contactMessage.create({
        data: {
          organizationId: organization.id,
          serviceId: service?.id ?? null,
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: `Enquiry: ${serviceLabel}`,
          message: data.message,
          projectInterest: service?.title ?? "Other",
          subService,
          projectLocation: data.projectLocation,
          preferredContactMethod: data.preferredContactMethod || null,
          answers: answers.length > 0 ? answers : undefined,
          consentAt: new Date(),
        },
      });
      await tx.auditLog.create({ data: { organizationId: organization.id, module: "enquiries", action: "submit", recordId: enquiry.id, title: `New enquiry from ${data.name}`, details: { service: serviceLabel, answered: answers.length } } });
    });
    revalidatePath("/dashboard/messages");
    return { ok: true };
  }

  // Legacy single-tenant site (no Construct organization): no configurable
  // questions there, so fold the structured fields into the message text.
  await ensureMessageTableIsCompatible();
  const legacyService = data.serviceId && /^\d+$/.test(data.serviceId) ? await prisma.service.findFirst({ where: { id: Number(data.serviceId), isActive: true }, select: { title: true } }) : null;
  const body = [data.message, `Project location: ${data.projectLocation}`, data.preferredContactMethod && `Preferred contact: ${data.preferredContactMethod}`].filter(Boolean).join("\n\n");
  await prisma.message.create({ data: { name: data.name, email: data.email, phone: data.phone, subject: legacyService ? `Enquiry: ${legacyService.title}` : "Website enquiry", message: body, projectInterest: legacyService?.title ?? null } });
  revalidatePath("/admin/messages");
  return { ok: true };
}
