"use client";

import { useId } from "react";

import MediaPicker from "@/components/admin/media/MediaPicker";
import BaseField from "./BaseField";

interface ImageFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  preview?: string;
}

export default function ImageField({
  id,
  label,
  helperText,
  error,
  preview,
  ...props
}: ImageFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  const name =
    typeof props.name === "string"
      ? props.name
      : undefined;

  const defaultValue =
    typeof props.defaultValue === "string"
      ? props.defaultValue
      : preview ?? "";

  return (
    <BaseField
      id={fieldId}
      label={label}
      helperText={helperText}
      error={error}
    >
      <MediaPicker
        label={label}
        name={name}
        type="IMAGE"
        defaultValue={defaultValue}
        required={Boolean(props.required)}
      />
    </BaseField>
  );
}