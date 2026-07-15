"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

interface ImageUploadProps {
  label: string;
  name: string;
  defaultValue?: string;
}

export default function ImageUpload({
  label,
  name,
  defaultValue = "",
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File) {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message ?? "Image upload failed.");
        return;
      }

      setImageUrl(data.path);

      toast.success("Image uploaded successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to upload image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Label */}

      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      {/* Hidden input submitted with form */}

      <input
        type="hidden"
        name={name}
        value={imageUrl}
        readOnly
      />

      {/* Preview */}

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={label}
            width={1200}
            height={700}
            className="h-56 w-full object-cover"
          />
        ) : (
          <div className="flex h-56 items-center justify-center text-slate-400">
            No image selected
          </div>
        )}
      </div>

      {/* Hidden File Input */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file) {
            uploadImage(file);
          }
        }}
      />

      {/* Buttons */}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-slate-900 px-5 py-2 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>

        {imageUrl && (
          <button
            type="button"
            onClick={() => setImageUrl("")}
            className="rounded-lg border border-slate-300 px-5 py-2 transition hover:bg-slate-100"
          >
            Remove
          </button>
        )}
      </div>

      {/* File path */}

      {imageUrl && (
        <p className="break-all text-xs text-slate-500">
          {imageUrl}
        </p>
      )}
    </div>
  );
}