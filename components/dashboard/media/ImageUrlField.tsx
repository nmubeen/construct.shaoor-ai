"use client";

import { useRef, useState } from "react";
import { Folder, ImageOff, Images } from "lucide-react";

export type PickableImage = { id: string; url: string; title: string | null; originalName: string; folderId?: string | null };
export type PickerFolder = { id: string; name: string; depth: number };

function PickerDialog({ dialogRef, images, folders = [], onPick }: { dialogRef: React.RefObject<HTMLDialogElement | null>; images: PickableImage[]; folders?: PickerFolder[]; onPick: (url: string) => void }) {
  // undefined = "All images" (no filter), "none" = unfiled only, or a
  // real folder id — same tri-state the Media Library page itself uses,
  // so this picker feels like a smaller version of that same tree.
  const [activeFolder, setActiveFolder] = useState<string | undefined>(undefined);
  const hasFolders = folders.length > 0;
  const visibleImages = !hasFolders || activeFolder === undefined
    ? images
    : images.filter((image) => (activeFolder === "none" ? !image.folderId : image.folderId === activeFolder));

  return (
    <dialog ref={dialogRef} className="w-[calc(100%-2rem)] max-w-4xl rounded-lg border border-slate-200 p-0 backdrop:bg-black/40">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h3 className="font-bold text-slate-950">Choose from Media Library</h3>
        <button type="button" onClick={() => dialogRef.current?.close()} className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">
          Close
        </button>
      </div>
      <div className={`flex max-h-[65vh] ${hasFolders ? "" : ""}`}>
        {hasFolders && (
          <nav className="w-48 shrink-0 overflow-y-auto border-r border-slate-200 p-2">
            <button type="button" onClick={() => setActiveFolder(undefined)} className={`mb-0.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium ${activeFolder === undefined ? "bg-[#eef3ec] text-[#094136]" : "text-slate-600 hover:bg-slate-100"}`}>
              <Folder className="size-3.5 shrink-0" />All images
            </button>
            <button type="button" onClick={() => setActiveFolder("none")} className={`mb-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium ${activeFolder === "none" ? "bg-[#eef3ec] text-[#094136]" : "text-slate-600 hover:bg-slate-100"}`}>
              <Folder className="size-3.5 shrink-0" />No folder
            </button>
            <div className="space-y-0.5 border-t border-slate-100 pt-1">
              {folders.map((folder) => (
                <button
                  type="button"
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  style={{ paddingLeft: `${0.5 + folder.depth * 0.75}rem` }}
                  title={folder.name}
                  className={`flex w-full items-center gap-1.5 truncate rounded-md py-1.5 pr-2 text-left text-xs font-medium ${activeFolder === folder.id ? "bg-[#eef3ec] text-[#094136]" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <Folder className="size-3.5 shrink-0" /><span className="truncate">{folder.name}</span>
                </button>
              ))}
            </div>
          </nav>
        )}
        <div className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto p-4 sm:grid-cols-4">
          {visibleImages.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-slate-500">
              {images.length === 0 ? (
                <>No images uploaded yet. <a href="/dashboard/media" target="_blank" rel="noreferrer" className="font-semibold text-[#7D9D76] underline">Upload some in the Media Library</a>.</>
              ) : (
                "No images in this folder."
              )}
            </p>
          ) : (
            visibleImages.map((image) => (
              <button
                type="button"
                key={image.id}
                onClick={() => { onPick(image.url); dialogRef.current?.close(); }}
                title={image.title ?? image.originalName}
                className="group overflow-hidden rounded-md border border-slate-200 hover:border-[#7D9D76] focus:border-[#7D9D76] focus:outline-none"
              >
                {/* Native img, not next/image: arbitrary Supabase URLs in a
                    small picker grid, not worth the domain config. */}
                <img src={image.url} alt={image.title ?? image.originalName} className="aspect-square w-full object-cover" />
                <span className="block truncate bg-slate-50 px-1.5 py-1 text-left text-[10px] text-slate-500 group-hover:bg-[#eef3ec]">{image.title || image.originalName}</span>
              </button>
            ))
          )}
        </div>
      </div>
      <div className="border-t border-slate-200 p-3 text-right">
        <a href="/dashboard/media" target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#7D9D76] hover:underline">
          Upload more in Media Library →
        </a>
      </div>
    </dialog>
  );
}

// Text input for an image URL field, plus a "Browse library" button that
// opens the org's uploaded images in a picker dialog — used wherever a
// CMS admin form asks for an image URL, so it isn't type-it-by-hand only.
// Still a plain text input underneath: an external URL works exactly as
// before, this only adds a second way to fill it in.
export function ImageUrlField({
  label, name, defaultValue, required = false, hint, images, folders, wide = false, labelClassName, inputClassName, disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  hint?: string;
  images: PickableImage[];
  folders?: PickerFolder[];
  wide?: boolean;
  labelClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [previewFailed, setPreviewFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <label className={labelClassName ?? `text-sm font-semibold text-slate-700 ${wide ? "md:col-span-2" : ""}`}>
      {label}
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
      <div className="mt-1.5 flex gap-2">
        <input
          type="url"
          name={name}
          value={value}
          onChange={(event) => { setValue(event.target.value); setPreviewFailed(false); }}
          required={required}
          disabled={disabled}
          className={inputClassName ?? "min-w-0 flex-1 rounded-md border border-slate-300 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-[#7D9D76] focus:ring-4 focus:ring-[#7D9D76]/25 disabled:bg-slate-100"}
        />
        {!disabled && (
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Images className="size-3.5" />
            Browse
          </button>
        )}
      </div>
      {value && (
        previewFailed ? (
          <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><ImageOff className="size-3.5" />Preview unavailable</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="mt-2 h-20 w-32 rounded-md border border-slate-200 object-cover" onError={() => setPreviewFailed(true)} />
        )
      )}
      <PickerDialog dialogRef={dialogRef} images={images} folders={folders} onPick={(url) => { setValue(url); setPreviewFailed(false); }} />
    </label>
  );
}

// Same idea, for a one-URL-per-line textarea (project galleries): Browse
// appends the picked image as a new line instead of replacing the value.
export function ImageUrlListField({
  label, name, defaultValue, hint, images, folders,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
  images: PickableImage[];
  folders?: PickerFolder[];
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold text-slate-950">{label}</h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Images className="size-3.5" />
          Add from library
        </button>
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <textarea
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="mt-1.5 min-h-44 w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#7D9D76] focus:ring-4 focus:ring-[#7D9D76]/25"
      />
      <PickerDialog
        dialogRef={dialogRef}
        images={images}
        folders={folders}
        onPick={(url) => setValue((current) => (current.trim() ? `${current.replace(/\n+$/, "")}\n${url}` : url))}
      />
    </div>
  );
}
