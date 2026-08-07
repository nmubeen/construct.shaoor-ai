"use client";

import { forwardRef, useId } from "react";
import BaseField from "./BaseField";
import { inputClass } from "../styles";
import { cn } from "@/lib/utils";

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      required,
      className,
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
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${fieldId}-error`
              : helperText
              ? `${fieldId}-helper`
              : undefined
          }
          className={cn(inputClass, className)}
          {...props}
        />
      </BaseField>
    );
  }
);

TextField.displayName = "TextField";

export default TextField;