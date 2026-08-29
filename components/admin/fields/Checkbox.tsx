"use client";

import type { FieldValues, Path, UseFormRegister } from "react-hook-form";

interface CheckboxProps<TFieldValues extends FieldValues = FieldValues> {
  label: string;
  name: Path<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
}

export default function Checkbox<TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
  register,
}: CheckboxProps<TFieldValues>) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        {...register(name)}
        className="h-4 w-4"
      />

      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>
    </label>
  );
}
