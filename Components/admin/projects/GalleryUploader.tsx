"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaImages } from "react-icons/fa6";

interface GalleryUploaderProps {
  projectId: number;
}

export default function GalleryUploader({
  projectId,
}: GalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const [uploading, setUploading] = useState(false);

  async function uploadFiles(files: FileList) {
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();

        formData.append("file", file);
        formData.append(
          "projectId",
          projectId.toString()
        );

        const response = await fetch(
          "/api/gallery/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ?? "Upload failed."
          );
        }
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload gallery images."
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    uploadFiles(files);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFileChange}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 rounded-lg bg-[#0E4A7B] px-5 py-3 text-white transition hover:bg-[#0A365A] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FaImages />

        {uploading
          ? "Uploading..."
          : "Add Gallery Images"}
      </button>
    </div>
  );
}