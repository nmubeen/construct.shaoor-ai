import Link from "next/link";
import { Mail, Search } from "lucide-react";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

const statuses = ["ALL", "NEW", "READ", "REPLIED", "ARCHIVED"] as const;

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; error?: string }> }) {
  const context = await requireActiveConstructContext(); const query = await searchParams;
  const status = statuses.includes(query.status as typeof statuses[number]) ? query.status as typeof statuses[number] : "ALL"; const search = query.q?.trim().slice(0, 100) ?? "";
  const messages = await getConstructPrisma().contactMessage.findMany({ where: { organizationId: context.organizationId, ...(status !== "ALL" ? { status } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }, { subject: { contains: search, mode: "insensitive" } }] } : {}) }, orderBy: { createdAt: "desc" } });
  return <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-teal-700">Customer communication</p><h1 className="mt-2 text-3xl font-bold">Enquiries</h1><p className="mt-2 text-sm text-slate-600">Review and track messages submitted through this tenant&apos;s website.</p></header>
    {query.error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
    <form className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_180px_auto]"><label className="relative"><Search className="absolute left-3 top-3 size-4 text-slate-400"/><input name="q" defaultValue={search} placeholder="Search name, email or subject" className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm"/></label><select name="status" defaultValue={status} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm">{statuses.map(item => <option key={item} value={item}>{item === "ALL" ? "All statuses" : item.charAt(0) + item.slice(1).toLowerCase()}</option>)}</select><button className="rounded-xl bg-[#0E4A7B] px-4 py-2.5 text-sm font-semibold text-white">Filter</button></form>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{messages.length === 0 ? <div className="p-10 text-center text-slate-500"><Mail className="mx-auto mb-3 size-8"/>No enquiries match this view.</div> : <div className="divide-y">{messages.map(message => <Link key={message.id} href={`/dashboard/messages/${message.id}`} className="block p-4 transition hover:bg-slate-50"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className={`truncate ${message.status === "NEW" ? "font-bold" : "font-semibold"}`}>{message.subject || `Enquiry from ${message.name}`}</h2><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${message.status === "NEW" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}>{message.status}</span></div><p className="mt-1 text-sm text-slate-600">{message.name} · {message.email}</p><p className="mt-2 line-clamp-1 text-xs text-slate-500">{message.message}</p></div><time className="shrink-0 text-xs text-slate-400">{message.createdAt.toLocaleDateString()}</time></div></Link>)}</div>}</div>
  </div>;
}
