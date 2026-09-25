import Link from "next/link";
import { Eye, FileText, MessageSquare } from "lucide-react";

import { NextFollowUpBadge } from "@/components/followups/NextFollowUpBadge";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { getNextOpenFollowUpsByProposalIds } from "@/lib/services/construct-followup.service";

type FilterKey = "all" | "DRAFT" | "PUBLISHED" | "EXPIRED" | "REVOKED";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-[#eef3ec] text-(--color-secondary-text-icon)",
  EXPIRED: "bg-amber-50 text-amber-700",
  REVOKED: "bg-red-50 text-red-700",
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "DRAFT", label: "Draft" },
  { key: "PUBLISHED", label: "Published" },
  { key: "EXPIRED", label: "Expired" },
  { key: "REVOKED", label: "Revoked" },
];

export default async function ProposalsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const context = await requireActiveConstructContext();
  const query = await searchParams;
  const activeFilter = (FILTERS.find((f) => f.key === query.status)?.key ?? "all") as FilterKey;
  const search = (query.q ?? "").trim();

  const prisma = getConstructPrisma();
  const proposals = await prisma.proposal.findMany({
    where: {
      organizationId: context.organizationId,
      ...(search ? { OR: [{ reference: { contains: search, mode: "insensitive" } }, { title: { contains: search, mode: "insensitive" } }, { enquiry: { name: { contains: search, mode: "insensitive" } } }] } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { enquiry: { select: { name: true } }, _count: { select: { responses: true } } },
    take: 100,
  });

  const nextFollowUps = await getNextOpenFollowUpsByProposalIds(context.organizationId, proposals.map((p) => p.id));

  const withDerivedStatus = proposals.map((p) => ({
    ...p,
    displayStatus: p.status === "PUBLISHED" && p.expiresAt && p.expiresAt < new Date() ? "EXPIRED" : p.status,
  }));
  const filtered = activeFilter === "all" ? withDerivedStatus : withDerivedStatus.filter((p) => p.displayStatus === activeFilter);

  const filterHref = (key: FilterKey) => `/dashboard/proposals?${new URLSearchParams({ ...(key !== "all" ? { status: key } : {}), ...(search ? { q: search } : {}) }).toString()}`;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-secondary-text-icon)">Sales</p><h1 className="mt-2 text-3xl font-bold text-(--color-primary-text)">Proposals</h1><p className="mt-2 text-sm text-slate-600">Personalised proposals prepared from customer enquiries. Start one from an enquiry&apos;s detail page.</p></header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">{FILTERS.map((f) => <Link key={f.key} href={filterHref(f.key)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeFilter === f.key ? "bg-(image:--gradient-button-bg) text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>{f.label}</Link>)}</div>
        <form className="flex gap-2"><input type="hidden" name="status" value={activeFilter === "all" ? "" : activeFilter} /><input name="q" defaultValue={search} placeholder="Search by reference, title or customer" className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm" /><button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Search</button></form>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"><FileText className="mx-auto mb-3 size-8 text-slate-300" /><p>No proposals {activeFilter !== "all" ? `with status "${activeFilter.toLowerCase()}"` : "yet"}.</p><p className="mt-1 text-xs">Open an enquiry and select &quot;Prepare proposal&quot; to create one.</p></div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3">Activity</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><Link href={`/dashboard/proposals/${p.id}`} className="font-semibold text-(--color-secondary-text-icon) hover:underline">{p.reference}</Link><p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">{p.title}</p></td>
                  <td className="px-4 py-3 text-slate-700">{p.enquiry.name}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap items-center gap-1.5"><span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${STATUS_STYLE[p.displayStatus]}`}>{p.displayStatus}</span><NextFollowUpBadge dueAt={nextFollowUps.get(p.id)?.dueAt ?? null} timezone={context.organization.timezone} /></div></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.updatedAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-3 text-xs text-slate-500">{p.openCount > 0 && <span className="flex items-center gap-1" title={`Opened ${p.openCount} time(s)${p.lastOpenedAt ? `, last ${p.lastOpenedAt.toLocaleString()}` : ""}`}><Eye className="size-3.5" />{p.openCount}</span>}{p._count.responses > 0 && <span className="flex items-center gap-1 font-semibold text-(--color-secondary-text-icon)" title={`${p._count.responses} customer response(s)`}><MessageSquare className="size-3.5" />{p._count.responses}</span>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
