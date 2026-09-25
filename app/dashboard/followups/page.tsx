import Link from "next/link";
import { AlertTriangle, Bell, CalendarClock, ListChecks } from "lucide-react";

import { FollowUpDashboardList, type DashboardFollowUpRow } from "@/components/followups/FollowUpDashboardList";
import { FollowUpsAutoRefresh } from "@/components/followups/FollowUpsAutoRefresh";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { formatZonedDate, formatZonedDateTime, zonedWallTimeToUtc } from "@/lib/followups/timezone";
import { getEligibleAssignees, getFollowUpOverview, listFollowUps, type FollowUpStatusFilter } from "@/lib/services/construct-followup.service";

const STATUS_TABS: { key: FollowUpStatusFilter; label: string }[] = [
  { key: "OPEN", label: "All open" },
  { key: "OVERDUE", label: "Overdue" },
  { key: "TODAY", label: "Due today" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

type SearchParams = {
  scope?: string;
  status?: string;
  parentType?: string;
  assigneeId?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
};

export default async function FollowUpsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await requireActiveConstructContext();
  const query = await searchParams;
  const timezone = context.organization.timezone;
  const canEdit = context.role !== "VIEWER";

  const scope = query.scope === "all" ? "all" : "mine";
  const status = (STATUS_TABS.find((t) => t.key === query.status)?.key ?? "OPEN") as FollowUpStatusFilter;
  const parentType = query.parentType === "ENQUIRY" || query.parentType === "PROPOSAL" ? query.parentType : undefined;
  const search = query.q?.trim().slice(0, 100) ?? "";

  const dateFrom = query.dateFrom ? zonedWallTimeToUtc(`${query.dateFrom}T00:00`, timezone) : undefined;
  const dateTo = query.dateTo ? zonedWallTimeToUtc(`${query.dateTo}T00:00`, timezone) : undefined;
  // dateTo is entered as a calendar date but must include the whole day —
  // shift the boundary to the start of the NEXT day in the org's zone.
  const dateToExclusive = dateTo ? new Date(zonedWallTimeToUtc(`${query.dateTo}T00:00`, timezone).getTime() + 24 * 60 * 60 * 1000) : undefined;

  const [overview, assignees, rows] = await Promise.all([
    getFollowUpOverview(context.organizationId, context.userId, timezone),
    getEligibleAssignees(context.organizationId),
    listFollowUps(context.organizationId, context.userId, timezone, {
      scope,
      status,
      parentType,
      assigneeId: query.assigneeId || undefined,
      search: search || undefined,
      dateFrom,
      dateTo: dateToExclusive,
    }),
  ]);

  const dashboardRows: DashboardFollowUpRow[] = rows.map((row) => {
    const parentType: "ENQUIRY" | "PROPOSAL" = row.proposalId ? "PROPOSAL" : "ENQUIRY";
    const customerName = row.proposal?.enquiry.name ?? row.enquiry?.name ?? "Unknown";
    const parentLabel = row.proposal ? `Proposal ${row.proposal.reference}` : "Enquiry";
    const parentHref = row.proposal ? `/dashboard/proposals/${row.proposal.id}` : `/dashboard/messages/${row.enquiry?.id}`;
    return {
      id: row.id,
      title: row.title,
      dueAt: row.dueAt,
      status: row.status,
      assigneeName: row.assignee ? row.assignee.fullName || row.assignee.email : null,
      assigneeNeedsReassignment: row.status === "OPEN" && (!row.assigneeId || !assignees.some((a) => a.id === row.assigneeId)),
      parentType,
      parentHref,
      customerName,
      parentLabel,
    };
  });

  const buildHref = (overrides: Partial<SearchParams>) => {
    const current: SearchParams = { scope, status, parentType, assigneeId: query.assigneeId, q: search || undefined, dateFrom: query.dateFrom, dateTo: query.dateTo };
    const merged = { ...current, ...overrides };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    return `/dashboard/followups?${params.toString()}`;
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <FollowUpsAutoRefresh />
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-secondary-text-icon)">Sales operations</p>
        <h1 className="mt-2 text-3xl font-bold text-(--color-primary-text)">Follow-ups</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Internal reminders for enquiries and proposals. Everything here appears only in this dashboard — no email, SMS or push notification is ever sent automatically.</p>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <article className="construct-card p-5">
          <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-600">Overdue</p><span className="grid size-10 place-items-center rounded-md bg-red-50 text-red-700"><AlertTriangle className="size-5" /></span></div>
          <p className="mt-4 text-3xl font-bold text-slate-950">{overview.overdueCount}</p>
        </article>
        <article className="construct-card p-5">
          <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-600">Due today</p><span className="grid size-10 place-items-center rounded-md bg-[#eef3ec] text-(--color-primary-text)"><CalendarClock className="size-5" /></span></div>
          <p className="mt-4 text-3xl font-bold text-slate-950">{overview.dueTodayCount}</p>
        </article>
        <article className="construct-card p-5">
          <div className="mb-2 flex items-center gap-2"><Bell className="size-4 text-(--color-secondary-text-icon)" /><p className="text-sm font-semibold text-slate-700">Your next follow-ups</p></div>
          {overview.myNext.length === 0 ? <p className="text-xs text-slate-500">Nothing assigned to you right now.</p> : (
            <ul className="space-y-1.5">
              {overview.myNext.map((f) => (
                <li key={f.id} className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{f.title}</span> — {formatZonedDateTime(f.dueAt, timezone)}
                  <span className="text-slate-400"> · {f.proposal ? `${f.proposal.enquiry.name} (proposal)` : f.enquiry?.name}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link href={buildHref({ scope: undefined })} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${scope === "mine" ? "bg-(image:--gradient-button-bg) text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>My follow-ups</Link>
        <Link href={buildHref({ scope: "all" })} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${scope === "all" ? "bg-(image:--gradient-button-bg) text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>All follow-ups</Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link key={tab.key} href={buildHref({ status: tab.key })} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === tab.key ? "bg-(image:--gradient-button-bg) text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>{tab.label}</Link>
        ))}
      </div>

      <form className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-(image:--gradient-form-bg) p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_160px_160px_140px_140px_auto]">
        <input type="hidden" name="scope" value={scope} />
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={search} placeholder="Search customer or action title" className="rounded-md border border-slate-300 px-3 py-2.5 text-sm" />
        <select name="parentType" defaultValue={parentType ?? ""} className="rounded-md border border-slate-300 px-3 py-2.5 text-sm">
          <option value="">All types</option>
          <option value="ENQUIRY">Enquiry</option>
          <option value="PROPOSAL">Proposal</option>
        </select>
        <select name="assigneeId" defaultValue={query.assigneeId ?? ""} className="rounded-md border border-slate-300 px-3 py-2.5 text-sm">
          <option value="">All assignees</option>
          {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input type="date" name="dateFrom" defaultValue={query.dateFrom ?? ""} className="rounded-md border border-slate-300 px-3 py-2.5 text-sm" />
        <input type="date" name="dateTo" defaultValue={query.dateTo ?? ""} className="rounded-md border border-slate-300 px-3 py-2.5 text-sm" />
        <button className="rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white">Filter</button>
      </form>

      {dashboardRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <ListChecks className="mx-auto mb-3 size-8 text-slate-300" />
          <p>No follow-ups match this view.</p>
          <p className="mt-1 text-xs">Open an enquiry or proposal to schedule one.</p>
        </div>
      ) : (
        <FollowUpDashboardList rows={dashboardRows} timezone={timezone} canEdit={canEdit} />
      )}
      <p className="mt-4 text-xs text-slate-400">Showing due dates as of {formatZonedDate(new Date(), timezone)}, {timezone}.</p>
    </div>
  );
}
