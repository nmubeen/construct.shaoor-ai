"use client";

import Image from "next/image";
import Link from "next/link";
import { FaEye, FaPenToSquare, FaTrash } from "react-icons/fa6";
import type { Media } from "@prisma/client";

import { formatFileSize } from "@/lib/media";

interface MediaCardProps {
  item: Media;
  view: "grid" | "list";
  onPreview: (item: Media) => void;
  onDelete: (item: Media) => void;
}

function typeBadge(type: Media["type"]) {
  switch (type) {
    case "IMAGE":
      return "bg-green-100 text-green-700";
    case "VIDEO":
      return "bg-purple-100 text-purple-700";
    case "DOCUMENT":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function dimensions(item: Media) {
  if (!item.width || !item.height) {
    return "-";
  }

  return `${item.width} x ${item.height}`;
}

function formatCreatedDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export default function MediaCard({
  item,
  view,
  onPreview,
  onDelete,
}: MediaCardProps) {
  const isImage = item.type === "IMAGE";
  const previewUrl = item.thumbnailUrl || item.url;

  return (
    <article
      className={[
        "rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md",
        view === "list" ? "flex gap-4 p-4" : "overflow-hidden",
      ].join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden rounded-lg bg-slate-100",
          view === "list" ? "h-28 w-36 shrink-0" : "aspect-4/3 w-full rounded-none",
        ].join(" ")}
      >
        {isImage ? (
          <Image
            src={previewUrl}
            alt={item.altText || item.title || item.originalName}
            fill
            sizes={view === "list" ? "160px" : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs font-medium text-slate-500">
            {item.extension.toUpperCase()}
          </div>
        )}
      </div>

      <div className={view === "list" ? "flex-1" : "p-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {item.title || item.originalName}
            </h3>

            <p className="truncate text-sm text-slate-500">
              {item.fileName}
            </p>
          </div>

          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeBadge(item.type)}`}>
            {item.type}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 sm:text-sm">
          <div>
            <dt className="text-slate-400">Dimensions</dt>
            <dd className="font-medium text-slate-700">{dimensions(item)}</dd>
          </div>

          <div>
            <dt className="text-slate-400">Size</dt>
            <dd className="font-medium text-slate-700">{formatFileSize(item.fileSize)}</dd>
          </div>

          <div>
            <dt className="text-slate-400">Type</dt>
            <dd className="font-medium text-slate-700">.{item.extension}</dd>
          </div>

          <div>
            <dt className="text-slate-400">Created</dt>
            <dd className="font-medium text-slate-700">
              {formatCreatedDate(item.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onPreview(item)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            aria-label={`View ${item.originalName}`}
          >
            <FaEye />
            View
          </button>

          <Link
            href={`/admin/media/${item.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            aria-label={`Edit ${item.originalName}`}
          >
            <FaPenToSquare />
            Edit
          </Link>

          <button
            type="button"
            onClick={() => onDelete(item)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50"
            aria-label={`Delete ${item.originalName}`}
          >
            <FaTrash />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
