"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/construct-client";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { hasOptions, MAX_OPTION_LENGTH, MAX_OPTIONS, MAX_QUESTION_LENGTH, QUESTION_TYPES } from "@/lib/enquiry/questions";

// Dashboard CRUD for a service's enquiry questions. Every query is scoped
// by the signed-in membership's organizationId, and a question is only ever
// touched together with the service it belongs to — so one tenant can never
// read or change another's questions, even with a guessed id.

const formPath = (serviceId: string) => `/dashboard/services/${serviceId}/enquiry-form`;

const questionSchema = z.object({
  questionText: z.string().trim().min(3, "The question must be at least 3 characters.").max(MAX_QUESTION_LENGTH, `The question must be ${MAX_QUESTION_LENGTH} characters or fewer.`),
  questionType: z.enum(QUESTION_TYPES, "Choose a question type."),
});

export type SaveQuestionState = { error: string } | null;

function requireEditor(role: string, serviceId: string) {
  if (role === "VIEWER") redirect(`${formPath(serviceId)}?error=You do not have permission to change the enquiry form.`);
}

// Trims, drops blanks and case-insensitive duplicates, keeps the order typed.
function cleanOptions(values: FormDataEntryValue[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const text = String(value).trim();
    if (text && !seen.has(text.toLowerCase())) { seen.add(text.toLowerCase()); result.push(text); }
  }
  return result;
}

export async function saveEnquiryQuestionAction(_prev: SaveQuestionState, formData: FormData): Promise<SaveQuestionState> {
  const context = await requireActiveConstructContext();
  const serviceId = String(formData.get("serviceId") ?? "");
  const id = String(formData.get("id") ?? "").trim();
  if (context.role === "VIEWER") return { error: "You do not have permission to change the enquiry form." };

  const parsed = questionSchema.safeParse({ questionText: formData.get("questionText"), questionType: formData.get("questionType") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid question." };
  const { questionText, questionType } = parsed.data;

  let options: string[] | null = null;
  if (hasOptions(questionType)) {
    options = cleanOptions(formData.getAll("options"));
    if (options.length === 0) return { error: "Add at least one answer option for a select question." };
    if (options.length > MAX_OPTIONS) return { error: `A question can have at most ${MAX_OPTIONS} answer options.` };
    if (options.some((option) => option.length > MAX_OPTION_LENGTH)) return { error: `Each answer option must be ${MAX_OPTION_LENGTH} characters or fewer.` };
  }
  const isRequired = formData.get("isRequired") === "on";
  const isActive = formData.get("isActive") === "on";

  const prisma = getConstructPrisma();
  const service = await prisma.service.findFirst({ where: { id: serviceId, organizationId: context.organizationId }, select: { id: true, title: true } });
  if (!service) return { error: "Service not found." };

  try {
    await prisma.$transaction(async (tx) => {
      if (id) {
        const updated = await tx.serviceEnquiryQuestion.updateMany({ where: { id, serviceId, organizationId: context.organizationId }, data: { questionText, questionType, options: options ?? Prisma.DbNull, isRequired, isActive } });
        if (updated.count !== 1) throw new Error("QUESTION_NOT_FOUND");
        await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "enquiry_questions", action: "update", recordId: id, title: `Enquiry question updated (${service.title}): ${questionText}` } });
      } else {
        const last = await tx.serviceEnquiryQuestion.aggregate({ where: { serviceId, organizationId: context.organizationId }, _max: { displayOrder: true } });
        const created = await tx.serviceEnquiryQuestion.create({ data: { organizationId: context.organizationId, serviceId, questionText, questionType, options: options ?? Prisma.DbNull, isRequired, isActive, displayOrder: (last._max.displayOrder ?? -1) + 1 } });
        await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "enquiry_questions", action: "create", recordId: created.id, title: `Enquiry question added (${service.title}): ${questionText}` } });
      }
    });
  } catch (error) {
    return { error: error instanceof Error && error.message === "QUESTION_NOT_FOUND" ? "Question not found." : "The question could not be saved." };
  }
  revalidatePath(formPath(serviceId));
  redirect(`${formPath(serviceId)}?saved=1`);
}

// The remaining actions only receive a question id: the service is read
// back from the (organization-scoped) row, never taken from the form.
async function findOwnedQuestion(organizationId: string, id: string) {
  return getConstructPrisma().serviceEnquiryQuestion.findFirst({ where: { id, organizationId }, select: { id: true, serviceId: true, questionText: true, isActive: true } });
}

export async function toggleEnquiryQuestionAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  const question = await findOwnedQuestion(context.organizationId, String(formData.get("id") ?? ""));
  if (!question) redirect("/dashboard/services?error=Question not found.");
  requireEditor(context.role, question.serviceId);
  await getConstructPrisma().$transaction([
    getConstructPrisma().serviceEnquiryQuestion.updateMany({ where: { id: question.id, organizationId: context.organizationId }, data: { isActive: !question.isActive } }),
    getConstructPrisma().auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "enquiry_questions", action: question.isActive ? "disable" : "enable", recordId: question.id, title: `Enquiry question ${question.isActive ? "disabled" : "enabled"}: ${question.questionText}` } }),
  ]);
  revalidatePath(formPath(question.serviceId));
  redirect(formPath(question.serviceId));
}

export async function deleteEnquiryQuestionAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  const question = await findOwnedQuestion(context.organizationId, String(formData.get("id") ?? ""));
  if (!question) redirect("/dashboard/services?error=Question not found.");
  requireEditor(context.role, question.serviceId);
  await getConstructPrisma().$transaction([
    getConstructPrisma().serviceEnquiryQuestion.deleteMany({ where: { id: question.id, organizationId: context.organizationId } }),
    getConstructPrisma().auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "enquiry_questions", action: "delete", recordId: question.id, title: `Enquiry question deleted: ${question.questionText}` } }),
  ]);
  revalidatePath(formPath(question.serviceId));
  redirect(`${formPath(question.serviceId)}?deleted=1`);
}

// Persists a new order for a service's whole question list (arrow buttons
// and drag-and-drop both end up here). Takes the full list of ids in the
// desired order and renumbers them 0..n-1. Returns an error instead of
// redirecting so the client keeps its optimistic order and can roll back.
export async function reorderEnquiryQuestionsAction(serviceId: string, orderedIds: string[]): Promise<{ error?: string }> {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") return { error: "You do not have permission to change the enquiry form." };

  const prisma = getConstructPrisma();
  try {
    const error = await prisma.$transaction(async (tx) => {
      const existing = await tx.serviceEnquiryQuestion.findMany({ where: { organizationId: context.organizationId, serviceId }, select: { id: true } });
      // Must be exactly this service's questions — protects against a stale
      // page (a question added/deleted elsewhere) and against foreign ids.
      if (existing.length !== orderedIds.length || new Set(orderedIds).size !== orderedIds.length || !orderedIds.every((id) => existing.some((row) => row.id === id))) {
        return "The question list changed. Refresh the page and try again.";
      }
      for (const [index, id] of orderedIds.entries()) {
        await tx.serviceEnquiryQuestion.updateMany({ where: { id, serviceId, organizationId: context.organizationId }, data: { displayOrder: index } });
      }
      return null;
    });
    if (error) return { error };
  } catch {
    return { error: "The new order could not be saved." };
  }
  revalidatePath(formPath(serviceId));
  return {};
}
