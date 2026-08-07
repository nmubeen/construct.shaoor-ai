"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Media, MediaType } from "@prisma/client";
import { FaMagnifyingGlass, FaPlus, FaXmark } from "react-icons/fa6";

import { searchMedia } from "@/lib/actions/media.actions";
import { notify } from "@/lib/toast";

interface MediaPickerProps {
  label: string;
  name?: string;
  defaultValue?: string;
  type?: MediaType | "ALL";
  folder?: string;
  helperText?: string;
  required?: boolean;
  onPick?: (item: Media) => Promise<void> | void;
}

function titleFor(item: Media) {
  return item.title || item.originalName;
}

function isImageUrl(value: string) {
  return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(value);
}

export default function MediaPicker({
  label,
  name,
  defaultValue = "",
  type = "ALL",
  folder,
  helperText,
  required = false,
  onPick,
}: MediaPickerProps) {
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedUrl, setSelectedUrl] = useState(defaultValue);
  const [items, setItems] = useState<Media[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    const timeout = setTimeout(() => {
      startTransition(async () => {
        try {
          const result = await searchMedia(query, {
            type,
            folder,
            limit: 30,
          });

          if (active) {
            setItems(result);
          }
        } catch {
          if (active) {
            setItems([]);
            notify.error("Unable to load media items.");
          }
        }
      });
    }, 240);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [open, query, type, folder, startTransition]);

  const selectedLabel = useMemo(() => {
    const selected = items.find((item) => item.url === selectedUrl);

    if (selected) {
      return titleFor(selected);
    }

    return selectedUrl;
  }, [items, selectedUrl]);

  function chooseItem(item: Media) {
    setSelectedUrl(item.url);
    setOpen(false);

    if (onPick) {
      Promise.resolve(onPick(item)).catch((error) => {
        notify.error(error instanceof Error ? error.message : "Unable to use selected media.");
      });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-slate-700">{label}</label>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          <FaPlus />
          Choose from Library
        </button>
      </div>

      {name && <input type="hidden" name={name} value={selectedUrl} required={required} readOnly />}

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-50">
        {selectedUrl ? (
          isImageUrl(selectedUrl) ? (
            <div className="relative aspect-video w-full">
              <Image src={selectedUrl} alt={selectedLabel || label} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center px-3 text-sm font-medium text-slate-600">
              File selected
            </div>
          )
        ) : (
          <div className="flex h-40 items-center justify-center px-3 text-sm text-slate-500">No media selected</div>
        )}
      </div>

      {selectedUrl && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="truncate text-xs text-slate-600">{selectedLabel}</p>

          <button
            type="button"
            onClick={() => setSelectedUrl("")}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
          >
            Remove
          </button>
        </div>
      )}

      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close media picker"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div className="relative z-10 flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
              <h3 className="text-base font-semibold text-slate-900">Select Media</h3>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-100"
                aria-label="Close"
              >
                <FaXmark />
              </button>
            </div>

            <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
                <FaMagnifyingGlass className="text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search media"
                  className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isPending ? (
                <div className="py-10 text-center text-sm text-slate-500">Loading media...</div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">No media found. Upload files in Media Library first.</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => chooseItem(item)}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-[#0E4A7B] hover:shadow"
                    >
                      <div className="relative aspect-4/3 bg-slate-100">
                        {item.type === "IMAGE" ? (
                          <Image
                            src={item.thumbnailUrl || item.url}
                            alt={item.altText || titleFor(item)}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
                            .{item.extension}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 px-3 py-3">
                        <p className="truncate text-sm font-medium text-slate-800">{titleFor(item)}</p>
                        <p className="truncate text-xs text-slate-500">{item.originalName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-right sm:px-6">
              <Link
                href="/admin/media/upload"
                className="text-sm font-medium text-[#0E4A7B] hover:underline"
              >
                Need a new file? Upload in Media Library
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
