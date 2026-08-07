"use client";

import type { FieldError, FieldValues, Path, UseFormRegister } from "react-hook-form";

interface SelectProps<TFieldValues extends FieldValues = FieldValues> {
  label: string;
  name: Path<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  error?: FieldError;
  options: string[];
}

export default function Select<TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
  register,
  options,
  error,
}: SelectProps<TFieldValues>) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <select
        id={name}
        {...register(name)}
        className={`w-full rounded-lg border px-4 py-3 outline-none transition ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-slate-300 focus:border-[#0E4A7B]"
        }`}
      >
        <option value="">Select...</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-sm text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}
