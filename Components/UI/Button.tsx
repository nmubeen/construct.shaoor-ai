import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "success"
  | "ghost";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]",

    secondary:
      "bg-[var(--accent)] text-black hover:brightness-95",

    outline:
      "border border-[var(--border)] bg-white hover:bg-slate-50",

    danger:
      "bg-red-600 text-white hover:bg-red-700",

    success:
      "bg-green-600 text-white hover:bg-green-700",

    ghost:
      "hover:bg-slate-100",
  };

  return (
    <button
      className={`
        inline-flex
        items-center
        justify-center
        rounded-lg
        px-5
        py-3
        font-medium
        transition-all
        duration-200
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}