import Link from "next/link";
import { FaImages } from "react-icons/fa6";
import { MediaType } from "@prisma/client";

import { getMedia, getMediaFolders } from "@/lib/actions/media.actions";

import AdminPage from "@/components/admin/layout/AdminPage";
import EmptyState from "@/components/admin/common/EmptyState";
import MediaGrid from "@/components/admin/media/MediaGrid";
import MediaToolbar from "@/components/admin/media/MediaToolbar";
import MediaFolderTree from "@/components/admin/media/MediaFolderTree";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    folder?: string;
    extension?: string;
    sort?: string;
    view?: string;
    page?: string;
  }>;
}

function parseType(value?: string): "ALL" | MediaType {
  if (
    value === "IMAGE" ||
    value === "VIDEO" ||
    value === "DOCUMENT" ||
    value === "OTHER"
  ) {
    return value;
  }

  return "ALL";
}

function parseSort(value?: string): "newest" | "oldest" | "name" | "size" {
  if (value === "oldest" || value === "name" || value === "size") {
    return value;
  }

  return "newest";
}

function parseView(value?: string): "grid" | "list" {
  return value === "list" ? "list" : "grid";
}

function parsePage(value?: string) {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function pageHref(
  page: number,
  current: {
    q: string;
    type: "ALL" | MediaType;
    folder: string;
    extension: string;
    sort: "newest" | "oldest" | "name" | "size";
    view: "grid" | "list";
  },
) {
  const params = new URLSearchParams();

  if (current.q) params.set("q", current.q);
  if (current.type !== "ALL") params.set("type", current.type);
  if (current.folder) params.set("folder", current.folder);
  if (current.extension) params.set("extension", current.extension);
  if (current.sort !== "newest") params.set("sort", current.sort);
  if (current.view !== "grid") params.set("view", current.view);
  if (page > 1) params.set("page", String(page));

  const search = params.toString();
  return search ? `/admin/media?${search}` : "/admin/media";
}

export default async function MediaPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const query = (params.q ?? "").trim();
  const type = parseType(params.type);
  const folder = (params.folder ?? "").trim();
  const extension = (params.extension ?? "").trim();
  const sort = parseSort(params.sort);
  const view = parseView(params.view);
  const page = parsePage(params.page);

  const [result, folders] = await Promise.all([
    getMedia({
      page,
      pageSize: 30,
      search: query,
      type,
      folder,
      extension,
      sort,
    }),
    getMediaFolders(),
  ]);

  const previousHref = pageHref(Math.max(1, result.page - 1), {
    q: query,
    type,
    folder,
    extension,
    sort,
    view,
  });

  const nextHref = pageHref(Math.min(result.totalPages, result.page + 1), {
    q: query,
    type,
    folder,
    extension,
    sort,
    view,
  });

  return (
    <AdminPage
      title="Media Library"
      description="Upload, organize, and reuse files across all CMS modules."
      action={{
        label: "Upload Media",
        href: "/admin/media/upload",
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <MediaFolderTree folders={folders} selectedFolder={folder} />
        <div className="min-w-0 space-y-5">
          <MediaToolbar
            query={query}
            type={type}
            folder={folder}
            extension={extension}
            sort={sort}
            view={view}
            extensions={result.extensions}
          />

          {result.items.length === 0 ? (
            <EmptyState
              icon={<FaImages />}
              title="No Media Found"
              description="Upload files or adjust your filters to see results."
              actionLabel="Upload Media"
              actionHref="/admin/media/upload"
            />
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <p>
                  Showing {result.items.length} of {result.total} files
                </p>

                <p>
                  Page {result.page} of {result.totalPages}
                </p>
              </div>

              <MediaGrid items={result.items} view={view} />

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
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
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
