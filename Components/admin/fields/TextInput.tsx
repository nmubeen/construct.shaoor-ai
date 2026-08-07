"use client";

import { InputHTMLAttributes } from "react";
import type { FieldError, FieldValues, Path, UseFormRegister } from "react-hook-form";

interface TextInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "name"> {
  label: string;
  name: Path<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  error?: FieldError;
}

export default function TextInput<TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
  register,
  error,
  type = "text",
  ...props
}: TextInputProps<TFieldValues>) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        type={type}
        {...register(name)}
        {...props}
        className={`w-full rounded-lg border px-4 py-3 outline-none transition ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-slate-300 focus:border-[#0E4A7B]"
        }`}
      />

      {error?.message && (
        <p className="text-sm text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}
