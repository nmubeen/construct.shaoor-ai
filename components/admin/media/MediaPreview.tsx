"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FaDownload, FaMagnifyingGlassMinus, FaMagnifyingGlassPlus, FaXmark } from "react-icons/fa6";

interface MediaPreviewProps {
  open: boolean;
  url: string;
  title: string;
  isImage: boolean;
  onClose: () => void;
}

export default function MediaPreview({
  open,
  url,
  title,
  isImage,
  onClose,
}: MediaPreviewProps) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const zoomPercent = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close preview"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} preview`}
        className="relative z-10 flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
          <h2 className="truncate pr-3 text-sm font-semibold text-slate-900 sm:text-base">
            {title}
          </h2>

          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                  aria-label="Zoom out"
                >
                  <FaMagnifyingGlassMinus />
                </button>

                <span className="w-14 text-center text-sm font-medium text-slate-600">
                  {zoomPercent}
                </span>

                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                  aria-label="Zoom in"
                >
                  <FaMagnifyingGlassPlus />
                </button>
              </>
            )}

            <a
              href={url}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              aria-label="Download file"
            >
              <FaDownload />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              type="button"
              className="rounded-lg bg-slate-900 px-3 py-2 text-white transition hover:bg-slate-700"
              onClick={onClose}
              aria-label="Close preview"
            >
              <FaXmark />
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-auto bg-slate-950 p-4">
          {isImage ? (
            <div
              className="relative mx-auto h-full w-full"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            >
              <Image
                src={url}
                alt={title}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-slate-200">
              <p>Preview is unavailable for this file type. Use Download to open the file.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
