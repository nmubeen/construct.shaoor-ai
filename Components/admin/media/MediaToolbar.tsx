import Link from "next/link";
import { MediaType } from "@prisma/client";
import { FaGrip, FaList } from "react-icons/fa6";

import MediaFilters from "./MediaFilters";

interface MediaToolbarProps {
  query: string;
  type: "ALL" | MediaType;
  folder: string;
  extension: string;
  sort: "newest" | "oldest" | "name" | "size";
  view: "grid" | "list";
  extensions: string[];
}

function buildViewHref(
  view: "grid" | "list",
  query: string,
  type: "ALL" | MediaType,
  folder: string,
  extension: string,
  sort: "newest" | "oldest" | "name" | "size",
) {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (type !== "ALL") params.set("type", type);
  if (folder) params.set("folder", folder);
  if (extension) params.set("extension", extension);
  if (sort !== "newest") params.set("sort", sort);
  params.set("view", view);

  const search = params.toString();
  return search ? `/admin/media?${search}` : "/admin/media";
}

export default function MediaToolbar({
  query,
  type,
  folder,
  extension,
  sort,
  view,
  extensions,
}: MediaToolbarProps) {
  const gridHref = buildViewHref("grid", query, type, folder, extension, sort);
  const listHref = buildViewHref("list", query, type, folder, extension, sort);

  return (
    <form
      action="/admin/media"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="view" value={view} />
      {folder && <input type="hidden" name="folder" value={folder} />}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <label htmlFor="media-search" className="sr-only">
            Search media
          </label>

          <input
            id="media-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by filename, title, alt text, description or folder"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
          />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={gridHref}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              view === "grid"
                ? "border-[#0E4A7B] bg-[#0E4A7B] text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
            aria-label="Grid view"
          >
            <FaGrip />
            Grid
          </Link>

          <Link
            href={listHref}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              view === "list"
                ? "border-[#0E4A7B] bg-[#0E4A7B] text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
            aria-label="List view"
          >
            <FaList />
            List
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-[#0E4A7B] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0A365A]"
          >
            Apply
          </button>
        </div>
      </div>

      <MediaFilters
        currentType={type}
        currentExtension={extension}
        currentSort={sort}
        extensions={extensions}
      />
    </form>
  );
}
