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
      className={`rounded-xl bg-[#094136] px-5 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#7D9D76] hover:shadow-md disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
