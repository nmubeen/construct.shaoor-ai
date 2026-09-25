import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { notFound } from "next/navigation";

import { DismissOnEdit } from "@/components/dashboard/shared/DismissOnEdit";

import { updateConstructMessageStatusAction } from "@/lib/actions/construct-message.actions";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { formatAnswer, parseStoredAnswers } from "@/lib/enquiry/questions";

export default async function MessageDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ updated?: string }> }) {
  const context = await requireActiveConstructContext(); const { id } = await params; const query = await searchParams;
  const message = await getConstructPrisma().contactMessage.findFirst({ where: { id, organizationId: context.organizationId } }); if (!message) notFound(); const answers = parseStoredAnswers(message.answers); const canUpdate = context.role !== "VIEWER";
  // Quotes the original enquiry into the reply's body so the answers are
  // there for reference without switching back to this tab — mailto:'s
  // `body` param, same as `subject` below. Two blank lines up top leave
  // room to type the actual reply above the quoted copy.
  const replyLines = [
    ...answers.map((item) => `${item.question}: ${formatAnswer(item.answer)}`),
    ...(message.message.trim() ? ["", "Additional requirements:", message.message.trim()] : []),
  ];
  const mailtoBody = `\n\n---\nOriginal enquiry from ${message.name}:\n\n${replyLines.join("\n")}`;
  return <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Link href="/dashboard/messages" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-(--color-secondary-text-icon)"><ArrowLeft className="size-4"/>Back to enquiries</Link>{query.updated && <DismissOnEdit><p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm text-(--color-secondary-text-icon)">Enquiry status updated.</p></DismissOnEdit>}
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><header className="border-b p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{message.status}</span><time className="text-xs text-slate-400">{message.createdAt.toLocaleString()}</time></div><h1 className="mt-3 text-2xl font-bold text-(--color-primary-text)">{message.subject || `Enquiry from ${message.name}`}</h1><p className="mt-1 text-sm text-slate-600">{message.name}</p></div>{canUpdate && <form action={updateConstructMessageStatusAction} className="flex gap-2"><input type="hidden" name="id" value={message.id}/><select name="status" defaultValue={message.status} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="NEW">New</option><option value="READ">Read</option><option value="REPLIED">Replied</option><option value="ARCHIVED">Archived</option></select><button className="rounded-lg bg-(image:--gradient-button-bg) px-3 py-2 text-sm font-semibold text-white">Update</button></form>}</div></header>
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_280px]"><div className="space-y-8">
        {answers.length > 0 && <section><h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Requirement details</h2><dl className="mt-3 divide-y rounded-md border border-slate-200">{answers.map((item, index) => <div key={`${item.questionId}-${index}`} className="p-3"><dt className="text-xs font-semibold text-slate-500">{item.question}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{formatAnswer(item.answer)}</dd></div>)}</dl></section>}
        {(message.message.trim() || answers.length === 0) && <section><h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{message.serviceId || message.projectInterest ? "Additional requirements" : "Message"}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{message.message.trim() || "None provided."}</p></section>}
      </div><aside className="space-y-4 rounded-md bg-slate-50 p-4"><div><p className="text-xs font-bold uppercase text-slate-400">Email</p><a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || "Your enquiry"}`)}&body=${encodeURIComponent(mailtoBody)}`} className="mt-1 inline-flex items-center gap-2 break-all text-sm font-semibold text-(--color-secondary-text-icon)"><Mail className="size-4"/>{message.email}</a></div>{message.phone && <div><p className="text-xs font-bold uppercase text-slate-400">Phone</p><a href={`tel:${message.phone}`} className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-(--color-secondary-text-icon)"><Phone className="size-4"/>{message.phone}</a></div>}{message.projectInterest && <div><p className="text-xs font-bold uppercase text-slate-400">Service</p><p className="mt-1 text-sm">{message.projectInterest}</p>{message.subService && <p className="text-sm text-slate-600">{message.subService}</p>}</div>}{message.projectLocation && <div><p className="text-xs font-bold uppercase text-slate-400">Project / site location</p><p className="mt-1 text-sm">{message.projectLocation}</p></div>}{message.preferredContactMethod && <div><p className="text-xs font-bold uppercase text-slate-400">Preferred contact</p><p className="mt-1 text-sm">{message.preferredContactMethod}</p></div>}<div><p className="text-xs font-bold uppercase text-slate-400">Consent recorded</p><p className="mt-1 text-sm">{message.consentAt ? message.consentAt.toLocaleString() : "Not recorded"}</p></div></aside></div>
    </article></div>;
}
