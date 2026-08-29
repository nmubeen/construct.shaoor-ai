"use client";

import { forwardRef, useId } from "react";
import BaseField from "./BaseField";
import { inputClass } from "../styles";
import { cn } from "@/lib/utils";

export interface TextAreaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
  error?: string;
}

const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(
  (
    {
      id,
      label,
      helperText,
      error,
      required,
      className,
      rows = 5,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    return (
      <BaseField
        id={fieldId}
        label={label}
        required={required}
        helperText={helperText}
        error={error}
      >
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${fieldId}-error`
              : helperText
              ? `${fieldId}-helper`
              : undefined
          }
          className={cn(
            inputClass,
            "min-h-37.5 resize-y",
            className
          )}
          {...props}
        />
      </BaseField>
    );
  }
);

TextAreaField.displayName = "TextAreaField";

export default TextAreaField;