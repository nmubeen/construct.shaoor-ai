import type { Client, Faq, TeamMember, Testimonial } from "@prisma/construct-client/client";
import { BookOpen, Building2, MessageSquareQuote, Plus, Users } from "lucide-react";

import { ConfirmActionButton } from "@/components/dashboard/settings/ConfirmActionButton";
import { deleteConstructContentAction, saveConstructContentAction, toggleConstructContentAction } from "@/lib/actions/construct-content.actions";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600";
function Field({ label, name, value, type = "text", required = false, min, max }: { label: string; name: string; value?: string | number | null; type?: string; required?: boolean; min?: number; max?: number }) {
  return <label className="grid gap-1 text-xs font-semibold text-slate-600">{label}<input className={inputClass} name={name} type={type} defaultValue={value ?? ""} required={required} min={min} max={max} /></label>;
}
function Area({ label, name, value, required = false }: { label: string; name: string; value?: string | null; required?: boolean }) {
  return <label className="grid gap-1 text-xs font-semibold text-slate-600 sm:col-span-2">{label}<textarea className={`${inputClass} min-h-24 resize-y`} name={name} defaultValue={value ?? ""} required={required} /></label>;
}
function Check({ label, name, checked = false }: { label: string; name: string; checked?: boolean }) {
  return <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input name={name} type="checkbox" defaultChecked={checked} className="size-4 accent-teal-600" />{label}</label>;
}
function FormFooter({ kind, id, active, canDelete }: { kind: string; id?: string; active?: boolean; canDelete: boolean }) {
  return <div className="flex flex-wrap items-center gap-2 sm:col-span-2"><button className="rounded-lg bg-[#0E4A7B] px-4 py-2 text-sm font-semibold text-white">{id ? "Save changes" : "Create item"}</button>{id && <><button formAction={toggleConstructContentAction} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">{active ? "Deactivate" : "Activate"}</button>{canDelete && <ConfirmActionButton formAction={deleteConstructContentAction} message="Permanently delete this content item?" className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" >Delete</ConfirmActionButton>}</>}<input type="hidden" name="kind" value={kind} />{id && <input type="hidden" name="id" value={id} />}</div>;
}

function TeamForm({ item, canDelete }: { item?: TeamMember; canDelete: boolean }) {
  return <form action={saveConstructContentAction} className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2"><Field label="Name" name="name" value={item?.name} required /><Field label="Slug" name="slug" value={item?.slug} required /><Field label="Designation" name="designation" value={item?.designation} required /><Field label="Photo URL" name="photoUrl" value={item?.photoUrl} type="url" required /><Area label="Short biography" name="shortBio" value={item?.shortBio} required /><Field label="Email" name="email" value={item?.email} type="email" /><Field label="Phone" name="phone" value={item?.phone} /><Field label="LinkedIn URL" name="linkedin" value={item?.linkedin} type="url" /><Field label="Instagram URL" name="instagram" value={item?.instagram} type="url" /><Field label="X / Twitter URL" name="twitter" value={item?.twitter} type="url" /><Field label="Display order" name="displayOrder" value={item?.displayOrder ?? 0} type="number" min={0} /><Check label="Show on homepage" name="showOnHomepage" checked={item?.showOnHomepage ?? true} /><Field label="SEO title" name="seoTitle" value={item?.seoTitle} /><Area label="SEO description" name="seoDescription" value={item?.seoDescription} /><Field label="SEO keywords" name="seoKeywords" value={item?.seoKeywords} /><Field label="Canonical URL" name="canonicalUrl" value={item?.canonicalUrl} type="url" /><FormFooter kind="team" id={item?.id} active={item?.isActive} canDelete={canDelete} /></form>;
}
function ClientForm({ item, canDelete }: { item?: Client; canDelete: boolean }) {
  return <form action={saveConstructContentAction} className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2"><Field label="Client name" name="name" value={item?.name} required /><Field label="Slug" name="slug" value={item?.slug} required /><Field label="Logo URL" name="logoUrl" value={item?.logoUrl} type="url" /><Field label="Website URL" name="website" value={item?.website} type="url" /><Field label="Category" name="category" value={item?.category} /><Field label="Display order" name="displayOrder" value={item?.displayOrder ?? 0} type="number" min={0} /><Area label="Description" name="description" value={item?.description} /><Check label="Featured client" name="featured" checked={item?.featured} /><FormFooter kind="client" id={item?.id} active={item?.isActive} canDelete={canDelete} /></form>;
}
function TestimonialForm({ item, canDelete }: { item?: Testimonial; canDelete: boolean }) {
  return <form action={saveConstructContentAction} className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2"><Field label="Client name" name="clientName" value={item?.clientName} required /><Field label="Company" name="company" value={item?.company} /><Field label="Designation" name="designation" value={item?.designation} /><Field label="Photo URL" name="photoUrl" value={item?.photoUrl} type="url" /><Field label="Project name" name="projectName" value={item?.projectName} /><Field label="Rating (1–5)" name="rating" value={item?.rating ?? 5} type="number" min={1} max={5} /><Area label="Testimonial" name="testimonial" value={item?.testimonial} required /><Field label="Display order" name="displayOrder" value={item?.displayOrder ?? 0} type="number" min={0} /><Check label="Featured testimonial" name="featured" checked={item?.featured} /><FormFooter kind="testimonial" id={item?.id} active={item?.isActive} canDelete={canDelete} /></form>;
}
function FaqForm({ item, canDelete }: { item?: Faq; canDelete: boolean }) {
  return <form action={saveConstructContentAction} className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2"><Field label="Question" name="question" value={item?.question} required /><Field label="Category" name="category" value={item?.category} /><Area label="Answer" name="answer" value={item?.answer} required /><Field label="Display order" name="displayOrder" value={item?.displayOrder ?? 0} type="number" min={0} /><Check label="Featured FAQ" name="featured" checked={item?.featured} /><FormFooter kind="faq" id={item?.id} active={item?.isActive} canDelete={canDelete} /></form>;
}

function ItemShell({ title, subtitle, active, children }: { title: string; subtitle: string; active: boolean; children: React.ReactNode }) {
  return <details className="overflow-hidden rounded-xl border border-slate-200 bg-white"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4"><span><span className="font-semibold text-slate-950">{title}</span><span className="ml-2 text-xs text-slate-500">{subtitle}</span></span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Active" : "Inactive"}</span></summary>{children}</details>;
}
function Section({ title, description, icon: Icon, count, addForm, children, canEdit }: { title: string; description: string; icon: typeof Users; count: number; addForm: React.ReactNode; children: React.ReactNode; canEdit: boolean }) {
  return <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><div className="mb-4 flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon className="size-5" /></span><div><h2 className="font-bold text-slate-950">{title} <span className="text-sm font-medium text-slate-400">({count})</span></h2><p className="text-sm text-slate-600">{description}</p></div></div></div>{canEdit && <details className="mb-3 overflow-hidden rounded-xl border border-dashed border-teal-300 bg-white"><summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-semibold text-teal-800"><Plus className="size-4" />Add new</summary>{addForm}</details>}<div className="grid gap-2">{children}</div></section>;
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> }) {
  const context = await requireActiveConstructContext(); const prisma = getConstructPrisma(); const query = await searchParams;
  const [team, clients, testimonials, faqs] = await Promise.all([
    prisma.teamMember.findMany({ where: { organizationId: context.organizationId }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }),
    prisma.client.findMany({ where: { organizationId: context.organizationId }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }),
    prisma.testimonial.findMany({ where: { organizationId: context.organizationId }, orderBy: [{ displayOrder: "asc" }, { clientName: "asc" }] }),
    prisma.faq.findMany({ where: { organizationId: context.organizationId }, orderBy: [{ displayOrder: "asc" }, { question: "asc" }] }),
  ]);
  const canEdit = context.role !== "VIEWER"; const canDelete = context.role === "OWNER" || context.role === "ADMIN";
  return <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Website CMS</p><h1 className="mt-2 text-3xl font-bold">Content</h1><p className="mt-2 text-sm text-slate-600">Manage reusable people, customer proof, and help content across the public website.</p></header>
    {(query.saved || query.deleted) && <p className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">Content updated successfully.</p>}{query.error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
    {!canEdit && <p className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">You have read-only access to this content.</p>}
    <div className="grid gap-5">
      <Section title="Leadership profiles" description="People shown on the team and homepage sections." icon={Users} count={team.length} canEdit={canEdit} addForm={<TeamForm canDelete={canDelete} />}>{team.map(item => <ItemShell key={item.id} title={item.name} subtitle={item.designation} active={item.isActive}>{canEdit && <TeamForm item={item} canDelete={canDelete} />}</ItemShell>)}</Section>
      <Section title="Clients" description="Customer logos and company references." icon={Building2} count={clients.length} canEdit={canEdit} addForm={<ClientForm canDelete={canDelete} />}>{clients.map(item => <ItemShell key={item.id} title={item.name} subtitle={item.category ?? "Client"} active={item.isActive}>{canEdit && <ClientForm item={item} canDelete={canDelete} />}</ItemShell>)}</Section>
      <Section title="Testimonials" description="Customer quotes used as social proof." icon={MessageSquareQuote} count={testimonials.length} canEdit={canEdit} addForm={<TestimonialForm canDelete={canDelete} />}>{testimonials.map(item => <ItemShell key={item.id} title={item.clientName} subtitle={item.company ?? "Testimonial"} active={item.isActive}>{canEdit && <TestimonialForm item={item} canDelete={canDelete} />}</ItemShell>)}</Section>
      <Section title="FAQs" description="Common questions and answers for prospective customers." icon={BookOpen} count={faqs.length} canEdit={canEdit} addForm={<FaqForm canDelete={canDelete} />}>{faqs.map(item => <ItemShell key={item.id} title={item.question} subtitle={item.category ?? "General"} active={item.isActive}>{canEdit && <FaqForm item={item} canDelete={canDelete} />}</ItemShell>)}</Section>
    </div>
  </div>;
}
