"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { FaCloudArrowUp, FaFolderTree, FaTrash } from "react-icons/fa6";

import { uploadMedia } from "@/lib/actions/media.actions";
import { ALLOWED_MEDIA_EXTENSIONS, MAX_MEDIA_FILE_SIZE, buildMediaAcceptList, formatFileSize } from "@/lib/media";
import { Messages } from "@/lib/messages";
import { notify } from "@/lib/toast";

interface PendingFile {
  id: string;
  file: File;
  status: "pending" | "success" | "error";
  message?: string;
}

function isAllowedFile(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_MEDIA_EXTENSIONS.includes(ext as (typeof ALLOWED_MEDIA_EXTENSIONS)[number]);
}

export default function MediaUpload() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [folder, setFolder] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);

  const acceptText = useMemo(() => buildMediaAcceptList(), []);

  const onDrop = (acceptedFiles: File[]) => {
    const next = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      status: "pending" as const,
    }));

    setFiles((current) => [...current, ...next]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_MEDIA_FILE_SIZE,
    multiple: true,
  });

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
  }

  function clearAll() {
    setFiles([]);
  }

  function uploadAll() {
    if (files.length === 0) {
      notify.error("Add at least one file before uploading.");
      return;
    }

    startTransition(async () => {
      const next = [...files];

      for (const item of next) {
        if (!isAllowedFile(item.file)) {
          item.status = "error";
          item.message = "Unsupported extension.";
          continue;
        }

        if (item.file.size > MAX_MEDIA_FILE_SIZE) {
          item.status = "error";
          item.message = "File exceeds 20MB.";
          continue;
        }

        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("folder", folder);

        try {
          await uploadMedia(formData);
          item.status = "success";
        } catch (error) {
          item.status = "error";
          item.message = error instanceof Error ? error.message : Messages.uploadFailed;
        }

        setFiles([...next]);
      }

      const uploadedCount = next.filter((item) => item.status === "success").length;
      if (uploadedCount > 0) {
        notify.success(`${uploadedCount} file${uploadedCount === 1 ? "" : "s"} uploaded successfully.`);
      }

      if (next.some((item) => item.status === "error")) {
        notify.error("Some files failed to upload.");
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-6 rounded-xl bg-white p-6 shadow sm:p-8">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label htmlFor="media-folder" className="mb-2 block text-sm font-medium text-slate-700">
            Folder (optional)
          </label>

          <input
            id="media-folder"
            type="text"
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
            placeholder="projects/ongoing"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <FaFolderTree />
            <span>Allowed: {ALLOWED_MEDIA_EXTENSIONS.join(", ")}</span>
          </div>
          <p className="mt-1">Max file size: {formatFileSize(MAX_MEDIA_FILE_SIZE)}</p>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
          isDragActive
            ? "border-[#0E4A7B] bg-[#0E4A7B]/5"
            : "border-slate-300 bg-slate-50 hover:border-[#0E4A7B]/60"
        }`}
      >
        <input {...getInputProps()} accept={acceptText} aria-label="Media upload input" />

        <FaCloudArrowUp className="mx-auto text-3xl text-slate-400" />
        <p className="mt-4 text-base font-medium text-slate-700">
          {isDragActive ? "Drop files here" : "Drag and drop files here, or click to select files"}
        </p>
        <p className="mt-2 text-sm text-slate-500">Files will be stored in /public/uploads</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{item.file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(item.file.size)}</p>
                {item.message && (
                  <p className="mt-1 text-xs text-red-600">{item.message}</p>
                )}
              </div>

              <div className="ml-4 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.status === "success"
                      ? "bg-green-100 text-green-700"
                      : item.status === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {item.status}
                </span>

                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={clearAll}
          className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={uploadAll}
          disabled={isPending || files.length === 0}
          className="rounded-lg bg-[#0E4A7B] px-6 py-2.5 font-medium text-white transition hover:bg-[#0A365A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Uploading..." : "Upload Files"}
        </button>
      </div>
    </div>
  );
}
