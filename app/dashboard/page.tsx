import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  ExternalLink,
  FolderKanban,
  ImageIcon,
  Mail,
  Wrench,
} from "lucide-react";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { formatZonedDateTime } from "@/lib/followups/timezone";
import { getFollowUpOverview } from "@/lib/services/construct-followup.service";

export default async function ConstructDashboardPage() {
  const context = await requireActiveConstructContext();
  const prisma = getConstructPrisma();
  const organizationId = context.organizationId;
  const [projects, services, media, messages, publication, primaryDomain, followUpOverview] =
    await Promise.all([
      prisma.project.count({ where: { organizationId } }),
      prisma.service.count({ where: { organizationId } }),
      prisma.media.count({ where: { organizationId } }),
      prisma.contactMessage.count({ where: { organizationId, status: "NEW" } }),
      prisma.sitePublication.findUnique({ where: { organizationId } }),
      prisma.domain.findFirst({ where: { organizationId, isPrimary: true } }),
      getFollowUpOverview(organizationId, context.userId, context.organization.timezone),
    ]);
  const cards = [
    { label: "Projects", value: projects, icon: FolderKanban },
    { label: "Services", value: services, icon: Wrench },
    { label: "Media items", value: media, icon: ImageIcon },
    { label: "New enquiries", value: messages, icon: Mail },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Standardized page-header band: PrimaryBackgroundColor
          (--gradient-primary-bg), same as the admin panel and the login
          screens — re-pointing the variable retints all of them. */}
      <header className="rounded-md bg-(image:--gradient-primary-bg) p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-secondary-text-icon)">
          Construct workspace
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {/* Explicit text-white: .construct-admin-surface's global
                h1/h2/h3 rule (globals.css) targets <h1> directly and beats
                the inherited white from this header, so it must be set
                here, not just on an ancestor. */}
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {context.organization.name}
            </h1>
            <p className="mt-2 text-sm text-slate-200">
              Your PostgreSQL-backed CMS workspace is active.
            </p>
          </div>
          <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase text-white">
            {publication?.status.toLowerCase() ?? "draft"}
          </span>
        </div>
      </header>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2"><Bell className="size-5 text-(--color-secondary-text-icon)" /><h2 className="font-bold text-(--color-primary-text)">Follow-ups</h2></div>
          <Link href="/dashboard/followups" className="text-xs font-semibold text-(--color-secondary-text-icon) hover:underline">Open Follow-ups →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-md bg-red-50 p-3"><AlertTriangle className="size-5 text-red-700" /><div><p className="text-xl font-bold text-red-700">{followUpOverview.overdueCount}</p><p className="text-xs text-red-700/80">Overdue</p></div></div>
          <div className="flex items-center gap-3 rounded-md bg-[#eef3ec] p-3"><CalendarClock className="size-5 text-(--color-primary-text)" /><div><p className="text-xl font-bold text-(--color-primary-text)">{followUpOverview.dueTodayCount}</p><p className="text-xs text-(--color-primary-text)/80">Due today</p></div></div>
          <div className="sm:col-span-1">
            <p className="mb-1 text-xs font-bold uppercase text-slate-400">Your next follow-ups</p>
            {followUpOverview.myNext.length === 0 ? <p className="text-xs text-slate-500">Nothing assigned to you right now.</p> : (
              <ul className="space-y-1">
                {followUpOverview.myNext.slice(0, 3).map((f) => (
                  <li key={f.id} className="truncate text-xs text-slate-600"><span className="font-semibold text-slate-800">{f.title}</span> — {formatZonedDateTime(f.dueAt, context.organization.timezone)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="construct-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <span className="grid size-10 place-items-center rounded-md bg-[#eef3ec] text-(--color-primary-text)">
                <Icon className="size-5" />
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold text-slate-950">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="construct-card p-6">
          <h2 className="text-lg font-bold text-(--color-primary-text)">
            CMS migration status
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Authentication, tenant access, website settings, services, projects,
            media, team, enquiries, SEO, domains and publication controls now
            use Supabase PostgreSQL.
          </p>
          {/* SecondaryBackgroundColor (--gradient-secondary-bg). */}
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full rounded-full bg-(image:--gradient-secondary-bg)" />
          </div>
          <p className="mt-2 text-xs font-medium text-(--color-primary-text)">
            Core tenant CMS migration complete
          </p>
        </article>
        {/* PrimaryBackgroundColor (--gradient-primary-bg). */}
        <article className="rounded-lg border border-transparent bg-(image:--gradient-primary-bg) p-6 text-white shadow-[0_12px_30px_rgba(9,65,54,.18)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--color-secondary-text-icon)">
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
          {/* FormBackgroundColor (--gradient-form-bg) + PrimaryTextColor. */}
          <a
            href={`https://${primaryDomain?.hostname ?? `${context.organization.slug}.construct.shaoor-ai.com`}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-(image:--gradient-form-bg) px-4 py-2.5 text-sm font-semibold text-(--color-primary-text) transition hover:brightness-95"
          >
            <ExternalLink className="size-4" />
            Open website preview
          </a>
        </article>
      </section>
    </div>
  );
}
