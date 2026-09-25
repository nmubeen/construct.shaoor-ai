import { ClipboardList, ImageIcon, Pencil, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deleteConstructServiceAction, toggleConstructServiceAction } from "@/lib/actions/construct-service.actions";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { SeedServicesButton } from "@/components/dashboard/SeedServicesButton";

function Thumbnail({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
      {src ? <Image src={src} alt={alt} width={64} height={64} unoptimized className="size-16 object-cover" /> : <ImageIcon className="size-5 text-slate-300" />}
    </div>
  );
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string; seeded?: string; confirmDelete?: string; unpublished?: string }> }) {
  const context = await requireActiveConstructContext();
  const services = await getConstructPrisma().service.findMany({ where: { organizationId: context.organizationId }, orderBy: [{ displayOrder: "asc" }, { title: "asc" }] });
  // One grouped query for every service's question counts (total + active), not one per card.
  const questionCounts = new Map<string, { total: number; active: number }>();
  for (const row of await getConstructPrisma().serviceEnquiryQuestion.groupBy({ by: ["serviceId", "isActive"], where: { organizationId: context.organizationId }, _count: { _all: true } })) {
    const current = questionCounts.get(row.serviceId) ?? { total: 0, active: 0 };
    current.total += row._count._all;
    if (row.isActive) current.active += row._count._all;
    questionCounts.set(row.serviceId, current);
  }
  const query = await searchParams;
  const canEdit = context.role !== "VIEWER";
  const sampleCount = services.filter((service) => service.isSample).length;
  const pendingDelete = (context.role === "OWNER" || context.role === "ADMIN")
    ? services.find(service => service.id === query.confirmDelete)
    : undefined;
  return <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-secondary-text-icon)">Website CMS</p><h1 className="mt-2 text-3xl font-bold text-(--color-primary-text)">Services</h1><p className="mt-2 text-sm text-slate-600">Manage the capabilities presented on your website.</p></div>{canEdit && <Link href="/dashboard/services/new" className="inline-flex items-center gap-2 rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white"><Plus className="size-4" />New service</Link>}</header>
    {sampleCount > 0 && <p role="status" className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{sampleCount === services.length ? "These are sample services" : `${sampleCount} of these are sample services`}, added automatically so your site isn&apos;t empty. Edit, replace or delete any of them{canEdit ? " — saving your own changes to one removes its “Sample” tag" : ""}.</p>}
    {query.seeded && <p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm text-(--color-secondary-text-icon)">Seeded {query.seeded} default services with placeholder images — edit, replace or delete any of them to make them your own.</p>}{(query.saved || query.deleted) && <p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm font-semibold text-(--color-primary-text)">Services updated successfully.</p>}{query.error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
    {query.unpublished && <p role="status" className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Your website is now unpublished. Add at least one service before publishing it again.</p>}
    {pendingDelete && <section role="alert" aria-labelledby="last-service-heading" className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950">
      <h2 id="last-service-heading" className="font-bold">Keep at least one service to stay published</h2>
      <p className="mt-2 text-sm">Deleting &quot;{pendingDelete.title}&quot; would leave your published website without any services. Keep this service, or unpublish your website and delete it. Unpublishing takes your website offline.</p>
      <div className="mt-4 flex flex-wrap items-start gap-3">
        <Link href="/dashboard/services" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">Keep service</Link>
        <form action={deleteConstructServiceAction}>
          <input type="hidden" name="id" value={pendingDelete.id} />
          <input type="hidden" name="unpublish" value="yes" />
          <button className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700">Unpublish and delete</button>
        </form>
      </div>
    </section>}
    <div className="grid gap-4">{services.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"><p>No services yet.</p>{canEdit && <>
      <p className="mt-1">Create the first service for this tenant, or start from a ready-made catalogue.</p>
      <div className="mt-4 flex justify-center"><SeedServicesButton /></div>
      <p className="mt-2 text-xs text-slate-400">Adds 15 standard construction services with placeholder images to a &quot;Services&quot; media folder — fully yours to edit, replace or delete afterward. Only available while this list is empty.</p>
    </>}</div> : services.map((service) => <article key={service.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><Thumbnail src={service.imageUrl} alt={service.title} /><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-950">{service.title}</h2><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${service.isActive ? "bg-[#eef3ec] text-(--color-secondary-text-icon)" : "bg-red-50 text-red-700"}`}>{service.isActive ? "Active" : "Inactive"}</span>{service.isSample && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Sample</span>}</div><p className="mt-1 text-sm text-slate-600">{service.shortDescription}</p><p className="mt-2 text-xs text-slate-400">/{service.slug} · Order {service.displayOrder}</p></div></div><div className="flex flex-wrap gap-2"><Link href={`/dashboard/services/${service.id}/enquiry-form`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"><ClipboardList className="size-4" />Configure Enquiry Form{(questionCounts.get(service.id)?.total ?? 0) > 0 && <span title={`${questionCounts.get(service.id)?.total} configured, ${questionCounts.get(service.id)?.active} active`} className="rounded-full bg-[#eef3ec] px-2 py-0.5 text-xs font-bold text-(--color-secondary-text-icon)">{questionCounts.get(service.id)?.total}</span>}</Link>{context.role !== "VIEWER" && <><Link href={`/dashboard/services/${service.id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"><Pencil className="size-4" />Edit</Link><form action={toggleConstructServiceAction}><input type="hidden" name="id" value={service.id} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">{service.isActive ? "Deactivate" : "Activate"}</button></form></>}{(context.role === "OWNER" || context.role === "ADMIN") && <form action={deleteConstructServiceAction}><input type="hidden" name="id" value={service.id} /><button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Delete</button></form>}</div></div></article>)}</div>
  </div>;
}
