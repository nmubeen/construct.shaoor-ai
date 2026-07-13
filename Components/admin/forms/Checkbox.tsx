"use client";

import { UseFormRegister } from "react-hook-form";

interface CheckboxProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
}

export default function Checkbox({
  label,
  name,
  register,
}: CheckboxProps) {
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