"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  asChild = false,
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[#094136] text-white hover:bg-[#7D9D76] focus:ring-[#7D9D76]",

    secondary:
      "bg-[#7D9D76] text-white hover:bg-[#094136] focus:ring-[#7D9D76]",

    outline:
      "border border-[#7D9D76] bg-white text-[#094136] hover:bg-[#eef3ec]",

    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",

    md: "h-10 px-5 text-sm",

    lg: "h-11 px-6 text-base",
  };

  const classNames = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-60",

    variants[variant],

    sizes[size],

    fullWidth && "w-full",

    className
  );

  if (asChild) {
    return (
      <Slot
        aria-disabled={disabled || loading}
        className={cn(
          classNames,
          (disabled || loading) && "pointer-events-none opacity-60"
        )}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      disabled={disabled || loading}
      className={classNames}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              opacity="0.25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>

          Loading...
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
}
