import { ButtonHTMLAttributes } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function PrimaryButton({
  className = "",
  children,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-[#0E4A7B] px-5 py-3 font-semibold text-white transition hover:bg-[#0B3A61] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}