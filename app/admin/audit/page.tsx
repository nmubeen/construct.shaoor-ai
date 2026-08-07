import Link from "next/link";
import { FaClipboardList } from "react-icons/fa6";

import { getAuditLogs } from "@/lib/actions/audit.actions";

import AdminPage from "@/components/admin/layout/AdminPage";
import AdminSection from "@/components/admin/layout/AdminSection";
import EmptyState from "@/components/admin/common/EmptyState";
import AuditFilters from "@/components/admin/audit/AuditFilters";
import AuditTable from "@/components/admin/audit/AuditTable";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    module?: string;
    page?: string;
  }>;
}

function parsePage(value?: string) {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function pageHref(page: number, current: { q: string; module: string }) {
  const params = new URLSearchParams();

  if (current.q) params.set("q", current.q);
  if (current.module && current.module !== "ALL") params.set("module", current.module);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/admin/audit?${query}` : "/admin/audit";
}

export default async function AuditPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const query = (params.q ?? "").trim();
  const moduleFilter = (params.module ?? "ALL").trim() || "ALL";
  const page = parsePage(params.page);

  const result = await getAuditLogs({
    query,
    module: moduleFilter,
    page,
    pageSize: 20,
  });

  const previousHref = pageHref(Math.max(1, result.page - 1), {
    q: query,
    module: moduleFilter,
  });

  const nextHref = pageHref(Math.min(result.totalPages, result.page + 1), {
    q: query,
    module: moduleFilter,
  });

  return (
    <AdminPage title="Audit Log" description="Track important CMS activity across modules.">
      <AuditFilters query={query} module={moduleFilter} />

      {result.items.length === 0 ? (
        <EmptyState
          icon={<FaClipboardList />}
          title="No Audit Logs"
          description="No activity has been recorded for the selected filters yet."
        />
      ) : (
        <AdminSection title="Activity" description={`Showing ${result.items.length} of ${result.total} logs`}>
          <AuditTable logs={result.items} />

          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <Link
              href={previousHref}
              aria-disabled={result.page === 1}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                result.page === 1
                  ? "pointer-events-none border-slate-200 text-slate-400"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Previous
            </Link>

            <p className="text-sm text-slate-600">
              Page {result.page} of {result.totalPages}
            </p>

            <Link
              href={nextHref}
              aria-disabled={result.page === result.totalPages}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                result.page === result.totalPages
                  ? "pointer-events-none border-slate-200 text-slate-400"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Next
            </Link>
          </div>
        </AdminSection>
      )}
    </AdminPage>
  );
}
