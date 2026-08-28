"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { Upload } from "lucide-react";

export function MediaUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/construct/media", { method: "POST", body: new FormData(event.currentTarget) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      formRef.current?.reset();
      setMessage({ kind: "success", text: "File uploaded successfully." });
      router.refresh();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setPending(false);
    }
  }

  return <form ref={formRef} onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="grid gap-4 lg:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">File
        <input required name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,application/pdf" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal" />
        <span className="text-xs font-normal text-slate-500">JPG, PNG, WebP, AVIF or PDF. Maximum 10 MB.</span>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Folder
        <input name="folder" placeholder="library" maxLength={80} className="rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Title
        <input name="title" maxLength={160} className="rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Alternative text
        <input name="altText" maxLength={300} placeholder="Describe the image for accessibility" className="rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-slate-700 lg:col-span-2">Description
        <textarea name="description" maxLength={1000} rows={2} className="rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
      </label>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[#0E4A7B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Upload className="size-4" />{pending ? "Uploading…" : "Upload file"}</button>
      {message && <p className={`text-sm ${message.kind === "success" ? "text-teal-700" : "text-red-700"}`}>{message.text}</p>}
    </div>
  </form>;
}
