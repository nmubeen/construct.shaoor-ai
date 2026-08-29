"use client";

import { useId } from "react";
import BaseField from "./BaseField";

interface SwitchFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  text?: string;
}

export default function SwitchField({
  id,
  label,
  helperText,
  error,
  text = "Enabled",
  ...props
}: SwitchFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <BaseField
      id={fieldId}
      label={label}
      helperText={helperText}
      error={error}
    >
      <label className="inline-flex cursor-pointer items-center gap-3">
        <input
          id={fieldId}
          type="checkbox"
          className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          {...props}
        />

        <span className="text-sm text-slate-700">
          {text}
        </span>
      </label>
    </BaseField>
  );
}