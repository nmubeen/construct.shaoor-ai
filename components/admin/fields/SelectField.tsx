"use client";

import { forwardRef, useId } from "react";
import BaseField from "./BaseField";
import { inputClass } from "../styles";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

const SelectField = forwardRef<
  HTMLSelectElement,
  SelectFieldProps
>(
  (
    {
      id,
      label,
      helperText,
      error,
      required,
      className,
      options,
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
        <select
          ref={ref}
          id={fieldId}
          required={required}
          className={cn(inputClass, className)}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </BaseField>
    );
  }
);

SelectField.displayName = "SelectField";

export default SelectField;