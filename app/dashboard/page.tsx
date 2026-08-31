import {
  ExternalLink,
  FolderKanban,
  ImageIcon,
  Mail,
  Wrench,
} from "lucide-react";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

export default async function ConstructDashboardPage() {
  const context = await requireActiveConstructContext();
  const prisma = getConstructPrisma();
  const organizationId = context.organizationId;
  const [projects, services, media, messages, publication, primaryDomain] =
    await Promise.all([
      prisma.project.count({ where: { organizationId } }),
      prisma.service.count({ where: { organizationId } }),
      prisma.media.count({ where: { organizationId } }),
      prisma.contactMessage.count({ where: { organizationId, status: "NEW" } }),
      prisma.sitePublication.findUnique({ where: { organizationId } }),
      prisma.domain.findFirst({ where: { organizationId, isPrimary: true } }),
    ]);
  const cards = [
    { label: "Projects", value: projects, icon: FolderKanban },
    { label: "Services", value: services, icon: Wrench },
    { label: "Media items", value: media, icon: ImageIcon },
    { label: "New enquiries", value: messages, icon: Mail },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
          Construct workspace
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {context.organization.name}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Your PostgreSQL-backed CMS workspace is active.
            </p>
          </div>
          <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase text-teal-700">
            {publication?.status.toLowerCase() ?? "draft"}
          </span>
        </div>
      </header>
      <section className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <Icon className="size-5" />
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold text-slate-950">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            CMS migration status
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Authentication, tenant access, website settings, services, projects,
            media, team, enquiries, SEO, domains and publication controls now
            use Supabase PostgreSQL.
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-[#0E4A7B] to-teal-500" />
          </div>
          <p className="mt-2 text-xs font-medium text-teal-700">
            Core tenant CMS migration complete
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-400">
            Website address
          </p>
          <p className="mt-3 break-all font-semibold">
            {primaryDomain?.hostname ??
              `${context.organization.slug}.construct.shaoor-ai.com`}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Domain status: {primaryDomain?.status.toLowerCase() ?? "active"} ·
            Website: {publication?.status.toLowerCase() ?? "draft"}
          </p>
          <a
            href={`https://${primaryDomain?.hostname ?? `${context.organization.slug}.construct.shaoor-ai.com`}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
          >
            <ExternalLink className="size-4" />
            Open website preview
          </a>
        </article>
      </section>
    </div>
  );
}
