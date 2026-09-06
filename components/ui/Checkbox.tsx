"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, description, id, ...props },
  ref
) {
  const checkboxId = id ?? props.name;

  return (
    <label htmlFor={checkboxId} className="flex items-start gap-3">
      <input
        ref={ref}
        id={checkboxId}
        type="checkbox"
        className={clsx(
          "mt-1 h-4 w-4 rounded border-slate-300 text-[#094136] focus:ring-[#094136]",
          className
        )}
        {...props}
      />

      <span>
        <span className="block font-medium text-slate-900">{label}</span>
        {description && <span className="block text-sm text-slate-500">{description}</span>}
      </span>
    </label>
  );
});

export default Checkbox;