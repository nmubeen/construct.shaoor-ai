"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { AlertTriangle, ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";

import { reorderProgressPhotosAction, removeProgressPhotoAction } from "@/lib/actions/construct-progress.actions";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = { "image/jpeg": [], "image/png": [], "image/webp": [], "image/avif": [] };

export type ExistingPhoto = { id: string; url: string; caption: string | null };

type PendingFile = { key: string; file: File; caption: string; status: "pending" | "uploading" | "error"; error?: string };

// Mobile-first: a plain multi-file <input accept="image/*"> opens the
// phone's camera/gallery picker directly, layered with react-dropzone
// (already a dependency, precedent: components/admin/media/MediaUpload.tsx)
// for desktop drag-and-drop. Each selected file uploads immediately and
// sequentially (same per-file status-queue pattern as that precedent) —
// a failure never blocks the rest of the batch or the surrounding draft
// update, which stays saveable regardless (see the product spec: "Prevent
// a failed upload from producing a broken published update"). Reordering
// uses the same up/down-arrow convention as MilestoneManager/
// ProposalItemList, not native drag-and-drop, for consistency.
export function ProgressPhotoUploader({ updateId, photos: initialPhotos, canEdit }: { updateId: string; photos: ExistingPhoto[]; canEdit: boolean }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [reorderError, setReorderError] = useState("");
  const [, startReorder] = useTransition();
  const savedOrder = useRef(initialPhotos.map((p) => p.id));
  const fileInputRef = useRef<HTMLInputElement>(null);

  function queueFiles(files: FileList | File[]) {
    const next: PendingFile[] = Array.from(files).map((file) => ({ key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, file, caption: "", status: "pending" as const }));
    setPending((current) => [...current, ...next]);
    next.forEach((item) => void uploadOne(item));
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => queueFiles(accepted),
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    multiple: true,
    noClick: true,
  });

  async function uploadOne(item: PendingFile) {
    setPending((current) => current.map((p) => (p.key === item.key ? { ...p, status: "uploading" } : p)));
    try {
      const formData = new FormData();
      formData.set("file", item.file);
      formData.set("updateId", updateId);
      if (item.caption) formData.set("caption", item.caption);
      const response = await fetch("/api/construct/progress-media", { method: "POST", body: formData });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      setPending((current) => current.filter((p) => p.key !== item.key));
      router.refresh();
    } catch (error) {
      setPending((current) => current.map((p) => (p.key === item.key ? { ...p, status: "error", error: error instanceof Error ? error.message : "Upload failed." } : p)));
    }
  }

  function removePending(key: string) {
    setPending((current) => current.filter((p) => p.key !== key));
  }

  function retry(item: PendingFile) {
    void uploadOne(item);
  }

  function persistOrder(next: ExistingPhoto[]) {
    const ids = next.map((p) => p.id);
    if (ids.join() === savedOrder.current.join()) return;
    setReorderError("");
    startReorder(async () => {
      const result = await reorderProgressPhotosAction(updateId, ids);
      if (result.error) {
        setReorderError(result.error);
        setPhotos((current) => savedOrder.current.flatMap((id) => current.filter((p) => p.id === id)));
      } else {
        savedOrder.current = ids;
      }
    });
  }

  function moveBy(index: number, offset: -1 | 1) {
    const next = [...photos];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setPhotos(next);
    persistOrder(next);
  }

  async function remove(photoId: string) {
    setPhotos((current) => current.filter((p) => p.id !== photoId));
    await removeProgressPhotoAction(updateId, photoId);
    router.refresh();
  }

  if (!canEdit) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-md border border-slate-200"><Image src={p.url} alt={p.caption ?? ""} fill unoptimized className="object-cover" /></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div {...getRootProps()} className={`rounded-lg border-2 border-dashed p-6 text-center transition ${isDragActive ? "border-[#7D9D76] bg-[#eef3ec]" : "border-slate-300 bg-slate-50"}`}>
        <input {...getInputProps()} />
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) queueFiles(e.target.files); e.target.value = ""; }} />
        <ImagePlus className="mx-auto mb-2 size-6 text-slate-400" />
        <p className="text-sm text-slate-600">Drag photos here, or</p>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 rounded-md bg-(image:--gradient-button-bg) px-4 py-2 text-sm font-semibold text-white">Choose photos</button>
        <p className="mt-2 text-xs text-slate-400">JPG, PNG, WebP or AVIF. Up to 10 MB each.</p>
      </div>

      {pending.length > 0 && (
        <ul className="space-y-2">
          {pending.map((item) => (
            <li key={item.key} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-2.5">
              <div className="grid size-10 shrink-0 place-items-center rounded bg-slate-100">
                {item.status === "uploading" ? <Loader2 className="size-4 animate-spin text-slate-400" /> : item.status === "error" ? <AlertTriangle className="size-4 text-red-500" /> : <ImagePlus className="size-4 text-slate-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-700">{item.file.name}</p>
                <p className="text-xs text-slate-400">{item.status === "uploading" ? "Uploading…" : item.status === "error" ? item.error : "Queued"}</p>
              </div>
              {item.status === "error" && <button type="button" onClick={() => retry(item)} className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold">Retry</button>}
              <button type="button" onClick={() => removePending(item.key)} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Remove"><X className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}

      {reorderError && <p role="alert" className="text-xs text-red-600">{reorderError}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((p, index) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-md border border-slate-200">
              <Image src={p.url} alt={p.caption ?? ""} fill unoptimized className="object-cover" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                <div className="flex gap-1">
                  <button type="button" disabled={index === 0} onClick={() => moveBy(index, -1)} className="grid size-6 place-items-center rounded bg-white/90 text-slate-700 disabled:opacity-30" aria-label="Move left"><ChevronLeft className="size-3.5" /></button>
                  <button type="button" disabled={index === photos.length - 1} onClick={() => moveBy(index, 1)} className="grid size-6 place-items-center rounded bg-white/90 text-slate-700 disabled:opacity-30" aria-label="Move right"><ChevronRight className="size-3.5" /></button>
                </div>
                <button type="button" onClick={() => remove(p.id)} className="grid size-6 place-items-center rounded bg-white/90 text-red-600" aria-label="Remove photo"><X className="size-3.5" /></button>
              </div>
              {p.caption && <p className="truncate bg-black/50 px-1.5 py-1 text-[10px] text-white">{p.caption}</p>}
            </div>
          ))}
        </div>
      )}
      {photos.length === 0 && pending.length === 0 && <p className="text-xs text-slate-500">No photos added yet.</p>}
    </div>
  );
}
