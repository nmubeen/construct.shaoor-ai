import Link from "next/link";
import { Building2, Plus } from "lucide-react";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructEntitlements } from "@/lib/control/construct-subscription.service";
import { listProgressProjects } from "@/lib/services/construct-progress.service";

const LIFECYCLE_STYLE: Record<string, string> = {
  PLANNED: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-[#eef3ec] text-(--color-secondary-text-icon)",
  ON_HOLD: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  ARCHIVED: "bg-slate-100 text-slate-400",
};

const LIFECYCLE_FILTERS = ["ALL", "PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"] as const;

export default async function ProgressProjectsPage({ searchParams }: { searchParams: Promise<{ lifecycle?: string; q?: string; error?: string }> }) {
  const context = await requireActiveConstructContext();
  const query = await searchParams;
  const lifecycle = LIFECYCLE_FILTERS.find((key) => key === query.lifecycle) ?? "ALL";
  const search = (query.q ?? "").trim();

  const [projects, entitlements] = await Promise.all([
    listProgressProjects(context.organizationId, { search: search || undefined, lifecycle: lifecycle !== "ALL" ? lifecycle : undefined }),
    getConstructEntitlements(context.organizationId),
  ]);
  const isEntitled = Boolean(entitlements?.entitlements.find((e) => e.featureCode === "PRIVATE_PROJECT_PROGRESS")?.booleanValue);
  const canCreate = context.role !== "VIEWER" && isEntitled;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-secondary-text-icon)">Customer communication</p>
          <h1 className="mt-2 text-3xl font-bold text-(--color-primary-text)">Project progress</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Private pages sharing a customer&apos;s project stage, milestones and photos — never published to the public website.</p>
        </div>
        {canCreate && <Link href="/dashboard/progress/new" className="inline-flex items-center gap-2 rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white"><Plus className="size-4" />New project</Link>}
      </header>

      {query.error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
      {!isEntitled && <p className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Private project progress pages are not included in the current plan. Existing projects stay visible and links can still be revoked, but creating, editing, uploading and publishing are disabled until the plan is upgraded. <Link href="/dashboard/settings" className="font-semibold underline">See plans</Link>.</p>}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {LIFECYCLE_FILTERS.map((key) => (
            <Link key={key} href={`/dashboard/progress?${new URLSearchParams({ ...(key !== "ALL" ? { lifecycle: key } : {}), ...(search ? { q: search } : {}) }).toString()}`} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${lifecycle === key ? "bg-(image:--gradient-button-bg) text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
              {key === "ALL" ? "All" : key.charAt(0) + key.slice(1).toLowerCase().replace("_", " ")}
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="lifecycle" value={lifecycle === "ALL" ? "" : lifecycle} />
          <input name="q" defaultValue={search} placeholder="Search by customer or title" className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Search</button>
        </form>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <Building2 className="mx-auto mb-3 size-8 text-slate-300" />
          <p>No projects {lifecycle !== "ALL" ? `with status "${lifecycle.toLowerCase()}"` : "yet"}.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Lifecycle</th>
                <th className="px-4 py-3">Current stage</th>
                <th className="px-4 py-3">Last published update</th>
                <th className="px-4 py-3">Changes</th>
                <th className="px-4 py-3">Customer access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{p.customerName}</td>
                  <td className="px-4 py-3"><Link href={`/dashboard/progress/${p.id}`} className="font-semibold text-(--color-secondary-text-icon) hover:underline">{p.title}</Link></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${LIFECYCLE_STYLE[p.lifecycle]}`}>{p.lifecycle.replace("_", " ")}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.currentStage ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.lastPublishedUpdateAt ? p.lastPublishedUpdateAt.toLocaleDateString() : "None yet"}</td>
                  <td className="px-4 py-3">{p.hasDraftChanges ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">Pending</span> : <span className="text-xs text-slate-400">Up to date</span>}</td>
                  <td className="px-4 py-3">{p.customerAccessEnabled ? <span className="rounded-full bg-[#eef3ec] px-2 py-0.5 text-[10px] font-bold uppercase text-(--color-secondary-text-icon)">Enabled</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Disabled</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
