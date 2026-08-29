import type { Service } from "@prisma/construct-client";
import { saveConstructServiceAction } from "@/lib/actions/construct-service.actions";

const input = "mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100";
export function ServiceForm({ service, error }: { service?: Service; error?: string }) {
  return <form action={saveConstructServiceAction} className="space-y-5">
    {service && <input type="hidden" name="id" value={service.id} />}
    {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">Title<input className={input} name="title" defaultValue={service?.title} required /></label>
      <label className="text-sm font-semibold text-slate-700">Slug<input className={input} name="slug" defaultValue={service?.slug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">Short description<textarea className={`${input} min-h-24`} name="shortDescription" defaultValue={service?.shortDescription} required /></label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">Full description<textarea className={`${input} min-h-52`} name="description" defaultValue={service?.description} required /></label>
      <label className="text-sm font-semibold text-slate-700">Image URL<input className={input} type="url" name="imageUrl" defaultValue={service?.imageUrl ?? ""} /></label>
      <label className="text-sm font-semibold text-slate-700">Icon name<input className={input} name="icon" defaultValue={service?.icon ?? ""} /></label>
      <label className="text-sm font-semibold text-slate-700">Display order<input className={input} type="number" min="0" name="displayOrder" defaultValue={service?.displayOrder ?? 0} /></label>
    </section>
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"><h2 className="text-lg font-bold md:col-span-2">SEO</h2>
      <label className="text-sm font-semibold text-slate-700">SEO title<input className={input} name="seoTitle" defaultValue={service?.seoTitle ?? ""} /></label>
      <label className="text-sm font-semibold text-slate-700">Canonical URL<input className={input} type="url" name="canonicalUrl" defaultValue={service?.canonicalUrl ?? ""} /></label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">SEO description<textarea className={`${input} min-h-24`} name="seoDescription" defaultValue={service?.seoDescription ?? ""} /></label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">Keywords<input className={input} name="seoKeywords" defaultValue={service?.seoKeywords ?? ""} /></label>
    </section>
    <div className="flex justify-end"><button className="rounded-xl bg-[#0E4A7B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0A365A]">{service ? "Save changes" : "Create service"}</button></div>
  </form>;
}
