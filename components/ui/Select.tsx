"use client";

import { forwardRef, ReactNode, SelectHTMLAttributes } from "react";
import clsx from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, error, id, children, ...props },
  ref
) {
  const selectId = id ?? props.name;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        className={clsx(
          "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#0E4A7B] focus:ring-2 focus:ring-[#0E4A7B]/15",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/15",
          className
        )}
        {...props}
      >
        {children}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default Select;