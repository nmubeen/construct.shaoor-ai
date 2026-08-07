import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline";

type BaseProps = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
};

type LinkButtonProps = BaseProps & {
  href: string;
};

type ButtonProps =
  | LinkButtonProps
  | (Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
      BaseProps & {
        href?: never;
      });

export default function Button(props: ButtonProps) {
  const {
    children,
    className = "",
    variant = "primary",
  } = props;

  const baseClasses =
    "inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold transition duration-300";

  const variantClasses: Record<Variant, string> = {
    primary:
      "bg-[#0E4A7B] text-white hover:bg-[#0b3b63]",
    secondary:
      "bg-yellow-500 text-white hover:bg-yellow-400",
    outline:
      "border-2 border-white bg-transparent text-white hover:bg-white hover:text-[#0E4A7B]",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if ("href" in props && typeof props.href === "string") {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = props;

  return (
    <button
      type={type}
      className={classes}
      {...buttonProps}
    >
      {children}
    </button>
  );
}