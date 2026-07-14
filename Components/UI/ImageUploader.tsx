"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Props {
  value?: string;
  name: string;
}

export default function ImageUploader({
  value = "",
  name,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState(value);
  const [imagePath, setImagePath] = useState(value);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(value);
    setImagePath(value);
  }, [value]);

  function chooseImage() {
    if (!uploading) {
      inputRef.current?.click();
    }
  }

  async function upload(file: File) {
    const previousImage = imagePath;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Upload failed.");
      }

      setImagePath(result.path);
      setPreview(result.path);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Upload failed."
      );

      setPreview(previousImage);
      setImagePath(previousImage);
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    const objectUrl = URL.createObjectURL(file);

    setPreview(objectUrl);

    upload(file).finally(() => {
      URL.revokeObjectURL(objectUrl);
    });

    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <label className="block font-medium">
        Cover Image
      </label>

      <div className="relative h-72 overflow-hidden rounded-xl border bg-slate-100">
        {preview ? (
          <Image
            src={preview}
            alt="Cover Image"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            No Image Selected
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />

      <input
        type="hidden"
        name={name}
        value={imagePath}
      />

      <div className="flex gap-4">
        <button
          type="button"
          disabled={uploading}
          onClick={chooseImage}
          className="rounded-lg bg-[#0E4A7B] px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading
            ? "Uploading..."
            : "Choose Image"}
        </button>

        <button
          type="button"
          disabled={uploading || !preview}
          onClick={() => {
            setPreview("");
            setImagePath("");
          }}
          className="rounded-lg border px-5 py-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Remove
        </button>
      </div>
    </div>
  );
}