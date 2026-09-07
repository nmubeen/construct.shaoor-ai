import { ImageIcon, Pencil, Plus, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deleteConstructServiceAction, seedConstructDefaultServicesAction, toggleConstructServiceAction } from "@/lib/actions/construct-service.actions";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

function Thumbnail({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
      {src ? <Image src={src} alt={alt} width={64} height={64} unoptimized className="size-16 object-cover" /> : <ImageIcon className="size-5 text-slate-300" />}
    </div>
  );
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string; seeded?: string }> }) {
  const context = await requireActiveConstructContext();
  const services = await getConstructPrisma().service.findMany({ where: { organizationId: context.organizationId }, orderBy: [{ displayOrder: "asc" }, { title: "asc" }] });
  const query = await searchParams;
  const canEdit = context.role !== "VIEWER";
  return <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7D9D76]">Website CMS</p><h1 className="mt-2 text-3xl font-bold">Services</h1><p className="mt-2 text-sm text-slate-600">Manage the capabilities presented on your website.</p></div>{canEdit && <Link href="/dashboard/services/new" className="inline-flex items-center gap-2 rounded-md bg-[#094136] px-4 py-2.5 text-sm font-semibold text-white"><Plus className="size-4" />New service</Link>}</header>
    {query.seeded && <p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm text-[#7D9D76]">Seeded {query.seeded} default services with placeholder images — edit, replace or delete any of them to make them your own.</p>}{(query.saved || query.deleted) && <p className="mb-5 rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm text-[#7D9D76]">Services updated successfully.</p>}{query.error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
    <div className="grid gap-4">{services.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"><p>No services yet.</p>{canEdit && <>
      <p className="mt-1">Create the first service for this tenant, or start from a ready-made catalogue.</p>
      <form action={seedConstructDefaultServicesAction} className="mt-4 flex justify-center"><button className="inline-flex items-center gap-2 rounded-md border border-[#7D9D76] bg-white px-4 py-2.5 text-sm font-semibold text-[#094136] hover:bg-[#eef3ec]"><Sparkles className="size-4" />Seed default services</button></form>
      <p className="mt-2 text-xs text-slate-400">Adds 15 standard construction services with placeholder images to a &quot;Services&quot; media folder — fully yours to edit, replace or delete afterward. Only available while this list is empty.</p>
    </>}</div> : services.map((service) => <article key={service.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><Thumbnail src={service.imageUrl} alt={service.title} /><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-950">{service.title}</h2><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${service.isActive ? "bg-[#eef3ec] text-[#7D9D76]" : "bg-red-50 text-red-700"}`}>{service.isActive ? "Active" : "Inactive"}</span></div><p className="mt-1 text-sm text-slate-600">{service.shortDescription}</p><p className="mt-2 text-xs text-slate-400">/{service.slug} · Order {service.displayOrder}</p></div></div><div className="flex flex-wrap gap-2">{context.role !== "VIEWER" && <><Link href={`/dashboard/services/${service.id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"><Pencil className="size-4" />Edit</Link><form action={toggleConstructServiceAction}><input type="hidden" name="id" value={service.id} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">{service.isActive ? "Deactivate" : "Activate"}</button></form></>}{(context.role === "OWNER" || context.role === "ADMIN") && <form action={deleteConstructServiceAction}><input type="hidden" name="id" value={service.id} /><button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Delete</button></form>}</div></div></article>)}</div>
  </div>;
}
