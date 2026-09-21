import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { notFound } from "next/navigation";

import { EnquiryQuestionEditor } from "@/components/dashboard/services/EnquiryQuestionEditor";
import { EnquiryQuestionList } from "@/components/dashboard/services/EnquiryQuestionList";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { isQuestionType, parseOptions } from "@/lib/enquiry/questions";

export default async function EnquiryFormConfigPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string; edit?: string; saved?: string; deleted?: string; error?: string }> }) {
  const context = await requireActiveConstructContext();
  const { id } = await params;
  const query = await searchParams;
  const prisma = getConstructPrisma();
  const service = await prisma.service.findFirst({ where: { id, organizationId: context.organizationId }, select: { id: true, title: true } });
  if (!service) notFound();
  const rows = await prisma.serviceEnquiryQuestion.findMany({ where: { serviceId: service.id, organizationId: context.organizationId }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] });
  const questions = rows.flatMap((row) => isQuestionType(row.questionType) ? [{ ...row, questionType: row.questionType, options: parseOptions(row.options) }] : []);

  const canEdit = context.role !== "VIEWER";
  const base = `/dashboard/services/${service.id}/enquiry-form`;
  const editing = canEdit ? questions.find((question) => question.id === query.edit) : undefined;
  const showEditor = canEdit && (query.new === "1" || !!editing);

  return <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <Link href="/dashboard/services" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-(--color-secondary-text-icon)"><ArrowLeft className="size-4" />Back to services</Link>
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-secondary-text-icon)">Enquiry form</p><h1 className="mt-2 text-3xl font-bold text-(--color-primary-text)">{service.title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Questions visitors answer when they enquire about this service, after the standard contact details. Only active questions are shown, in the order below. With no questions, visitors still send a basic enquiry.</p></div>{canEdit && !showEditor && <Link href={`${base}?new=1`} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white"><Plus className="size-4" />Add question</Link>}</header>
    {(query.saved || query.deleted) && <p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm font-semibold text-(--color-primary-text)">{query.deleted ? "Question deleted." : "Question saved."}</p>}
    {query.error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
    {showEditor && <EnquiryQuestionEditor key={editing?.id ?? "new"} serviceId={service.id} question={editing} cancelHref={base} />}
    {questions.length === 0
      ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No questions yet. Visitors will see the standard contact details and an Additional Requirements box only.</div>
      // Keyed on what can change server-side (edit / toggle / delete / reorder) so the
      // list's local, optimistic order resets to the saved one after each of those.
      : <EnquiryQuestionList key={rows.map((row) => `${row.id}:${row.updatedAt.getTime()}`).join("|")} serviceId={service.id} base={base} canEdit={canEdit} questions={questions.map(({ id, questionText, questionType, options, isRequired, isActive }) => ({ id, questionText, questionType, options, isRequired, isActive }))} />}
  </div>;
}
