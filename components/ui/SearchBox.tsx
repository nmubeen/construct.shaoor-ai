"use client";

import { ChangeEvent, InputHTMLAttributes } from "react";
import clsx from "clsx";

interface SearchBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
}

export default function SearchBox({
  className,
  onChange,
  placeholder = "Search...",
  ...props
}: SearchBoxProps) {
  return (
    <div className="relative">
      <input
        type="search"
        className={clsx(
          "w-full rounded-xl border border-[#cdd9ca] bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7D9D76] focus:ring-2 focus:ring-[#7D9D76]/20",
          className
        )}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value, event)}
        {...props}
      />
    </div>
  );
}
