"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxPhoto = { id: string; url: string; caption: string | null };

// A single lightbox instance shared by the whole page (see
// ProgressContentView) — clicking any thumbnail opens it at that
// photo's index within the FULL flattened photo list across every
// update, so next/previous naturally moves through the whole page's
// photos, not just the current update's. next/image with `unoptimized`
// (same convention ProposalContentView already uses for arbitrary
// Supabase URLs) gets native lazy-loading for the thumbnail grid for
// free, without needing next.config's remotePatterns to cover the
// signed-URL path.
export function PhotoLightbox({ photos }: { photos: LightboxPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : Math.min(i + 1, photos.length - 1)));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : Math.max(i - 1, 0)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <button key={photo.id} type="button" onClick={() => setOpenIndex(index)} className="group relative aspect-square overflow-hidden rounded-md bg-slate-100">
            <Image src={photo.url} alt={photo.caption ?? ""} fill unoptimized loading="lazy" sizes="(max-width: 640px) 50vw, 33vw" className="object-cover transition group-hover:scale-105" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4" role="dialog" aria-modal="true" onClick={() => setOpenIndex(null)}>
          <div className="flex justify-end"><button type="button" onClick={() => setOpenIndex(null)} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close"><X className="size-5" /></button></div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {openIndex > 0 && (
              <button type="button" onClick={() => setOpenIndex((i) => (i === null ? i : i - 1))} className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Previous"><ChevronLeft className="size-6" /></button>
            )}
            <div className="relative h-full max-h-[80vh] w-full">
              <Image src={photos[openIndex].url} alt={photos[openIndex].caption ?? ""} fill unoptimized sizes="100vw" className="object-contain" />
            </div>
            {openIndex < photos.length - 1 && (
              <button type="button" onClick={() => setOpenIndex((i) => (i === null ? i : i + 1))} className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Next"><ChevronRight className="size-6" /></button>
            )}
          </div>
          {photos[openIndex].caption && <p className="pt-3 text-center text-sm text-white/80">{photos[openIndex].caption}</p>}
        </div>
      )}
    </>
  );
}
