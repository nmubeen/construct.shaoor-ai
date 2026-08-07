"use client";

import React from "react";
import {
  labelClass,
  helperClass,
  errorClass,
} from "../styles";

interface BaseFieldProps {
  id: string;
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}

export default function BaseField({
  id,
  label,
  required,
  helperText,
  error,
  children,
}: BaseFieldProps) {
  return (
    <div className="grid grid-cols-1 gap-2 py-4 md:grid-cols-[220px_1fr] md:items-start">
      <label
        htmlFor={id}
        className={labelClass}
      >
        {label}

        {required && (
          <span className="ml-1 text-red-600">*</span>
        )}
      </label>

      <div>
        {children}

        {helperText && !error && (
          <p
            id={`${id}-helper`}
            className={helperClass}
          >
            {helperText}
          </p>
        )}

        {error && (
          <p
            id={`${id}-error`}
            className={errorClass}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}