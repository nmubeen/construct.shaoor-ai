"use client";

import { useActionState } from "react";
import type { Service } from "@prisma/construct-client";
import { saveConstructServiceAction } from "@/lib/actions/construct-service.actions";
import { ServiceTitleSlugFields } from "@/components/dashboard/services/ServiceTitleSlugFields";
import { ImageUrlField, type PickableImage, type PickerFolder } from "@/components/dashboard/media/ImageUrlField";

const input = "mt-1.5 w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#7D9D76] focus:ring-4 focus:ring-[#7D9D76]/25";
const Hint = ({ children }: { children: React.ReactNode }) => <span className="mt-1 block text-xs font-normal text-slate-500">{children}</span>;
export function ServiceForm({ service, subServices, images, folders }: { service?: Service; subServices?: string[]; images: PickableImage[]; folders?: PickerFolder[] }) {
  const [state, formAction] = useActionState(saveConstructServiceAction, null);
  return <form action={formAction} className="space-y-5">
    {service && <input type="hidden" name="id" value={service.id} />}
    {state?.error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
      <ServiceTitleSlugFields isNew={!service} defaultTitle={service?.title} defaultSlug={service?.slug} inputClassName={input} />
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">Short description<Hint>Shown on the services list and card previews. 10–300 characters.</Hint><textarea className={`${input} min-h-24`} name="shortDescription" defaultValue={service?.shortDescription} required minLength={10} maxLength={300} /></label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">Full description<Hint>Shown on this service&apos;s own page. 20–10,000 characters.</Hint><textarea className={`${input} min-h-52`} name="description" defaultValue={service?.description} required minLength={20} maxLength={10000} /></label>
      <ImageUrlField label="Image URL" name="imageUrl" defaultValue={service?.imageUrl} hint="A direct link to an image representing this service. Must be a valid URL. Optional." images={images} folders={folders} />
      <label className="text-sm font-semibold text-slate-700">Icon name<Hint>An icon identifier used by the website theme, if supported. Up to 80 characters. Optional.</Hint><input className={input} name="icon" defaultValue={service?.icon ?? ""} maxLength={80} /></label>
      <label className="text-sm font-semibold text-slate-700">Display order<Hint>Lower numbers appear first in the services list. Whole number, 0–10,000.</Hint><input className={input} type="number" min="0" max="10000" step="1" name="displayOrder" defaultValue={service?.displayOrder ?? 0} /></label>
    </section>
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-bold">Sub-services</h2><p className="text-xs text-slate-500">One per line, up to 10. Shown as bullet points under this service on the public website.</p><textarea className={`${input} min-h-36`} name="subServices" defaultValue={subServices?.join("\n") ?? ""} /></section>
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"><h2 className="text-lg font-bold md:col-span-2">SEO</h2>
      <label className="text-sm font-semibold text-slate-700">SEO title<Hint>Overrides the page title search engines use. Up to 160 characters. Optional — falls back to the service title.</Hint><input className={input} name="seoTitle" defaultValue={service?.seoTitle ?? ""} maxLength={160} /></label>
      <label className="text-sm font-semibold text-slate-700">Canonical URL<Hint>Set only if this content is also published elsewhere and this address is the preferred one. Must be a valid URL. Optional.</Hint><input className={input} type="url" name="canonicalUrl" defaultValue={service?.canonicalUrl ?? ""} /></label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">SEO description<Hint>Shown in search engine results. Up to 320 characters. Optional — falls back to the short description.</Hint><textarea className={`${input} min-h-24`} name="seoDescription" defaultValue={service?.seoDescription ?? ""} maxLength={320} /></label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">Keywords<Hint>Comma-separated terms, up to 500 characters. Optional — most search engines no longer use this.</Hint><input className={input} name="seoKeywords" defaultValue={service?.seoKeywords ?? ""} maxLength={500} /></label>
    </section>
    <div className="sticky bottom-4 flex justify-end rounded-lg border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur"><button className="rounded-md bg-[#094136] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7D9D76]">{service ? "Save changes" : "Create service"}</button></div>
  </form>;
}
