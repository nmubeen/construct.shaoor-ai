"use client";

import MediaPicker from "@/components/admin/media/MediaPicker";

interface ImageUploadProps {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  helperText?: string;
}

export default function ImageUpload({
  label,
  name,
  defaultValue = "",
  required = false,
  helperText,
}: ImageUploadProps) {
  return (
    <MediaPicker
      label={label}
      name={name}
      type="IMAGE"
      defaultValue={defaultValue}
      required={required}
      helperText={helperText ?? "Select an image from your Media Library."}
    />
  );
}
