"use client";

import { InputHTMLAttributes } from "react";
import { FieldError, UseFormRegister } from "react-hook-form";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
}

export default function TextInput({
  label,
  name,
  register,
  error,
  type = "text",
  ...props
}: TextInputProps) {
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

      {error && (
        <p className="text-sm text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}