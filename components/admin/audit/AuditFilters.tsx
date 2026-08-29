interface AuditFiltersProps {
  query: string;
  module: string;
}

const MODULE_OPTIONS = [
  "ALL",
  "Projects",
  "Services",
  "Team",
  "Clients",
  "Testimonials",
  "FAQ",
  "Messages",
  "SEO",
  "Media",
  "Gallery",
  "Settings",
] as const;

export default function AuditFilters({ query, module }: AuditFiltersProps) {
  return (
    <form action="/admin/audit" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor="audit-search" className="mb-2 block text-sm font-medium text-slate-700">
            Search
          </label>
          <input
            id="audit-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search title or details"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
          />
        </div>

        <div>
          <label htmlFor="audit-module" className="mb-2 block text-sm font-medium text-slate-700">
            Module
          </label>
          <select
            id="audit-module"
            name="module"
            defaultValue={module || "ALL"}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
          >
            {MODULE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All" : option}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-[#0E4A7B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0A365A]"
        >
          Apply
        </button>
      </div>
    </form>
  );
}
