import { notFound, redirect } from "next/navigation";
import { ServiceForm } from "@/components/dashboard/services/ServiceForm";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { getConstructMediaPickerData } from "@/lib/services/construct-media-picker.service";
export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireActiveConstructContext(); if (context.role === "VIEWER") redirect("/dashboard/services"); const { id } = await params;
  const service = await getConstructPrisma().service.findFirst({ where: { id, organizationId: context.organizationId } }); if (!service) notFound();
  // Raw, not the typed client: SubService exists in Postgres but the
  // generated client here couldn't be regenerated (dev server holds the
  // query engine binary locked on Windows) — switch to
  // service.subServices via an `include` once a client regen picks it up.
  const [subServices, { images, folders }] = await Promise.all([
    getConstructPrisma().$queryRaw<{ text: string }[]>`SELECT text FROM construct.sub_services WHERE service_id = ${id}::uuid ORDER BY sort_order ASC`,
    getConstructMediaPickerData(context.organizationId),
  ]);
  return <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7D9D76]">Services</p><h1 className="mt-2 text-3xl font-bold">Edit service</h1></header><ServiceForm service={service} subServices={subServices.map((s) => s.text)} images={images} folders={folders} /></div>;
}
