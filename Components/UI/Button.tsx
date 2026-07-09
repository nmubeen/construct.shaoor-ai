import Link from "next/link";
import clsx from "clsx";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
}

export default function Button({
  href,
  children,
  variant = "primary",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "rounded-lg px-6 py-3 font-semibold transition-all duration-300",
        variant === "primary"
          ? "bg-[#F4B400] text-slate-900 hover:bg-yellow-500"
          : "border-2 border-white text-white hover:bg-white hover:text-slate-900"
      )}
    >
      {children}
    </Link>
  );
}