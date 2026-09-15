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
    "inline-flex items-center justify-center rounded-md px-6 py-3 font-semibold shadow-sm transition duration-300";

  const variantClasses: Record<Variant, string> = {
    // ButtonBackgroundColor (--gradient-button-bg).
    primary:
      "bg-(image:--gradient-button-bg) text-white hover:-translate-y-0.5 hover:brightness-110 hover:shadow-md",
    secondary:
      "bg-[#7D9D76] text-white hover:-translate-y-0.5 hover:bg-(--color-primary-text)",
    outline:
      "border-2 border-[#7D9D76] bg-transparent text-(--color-primary-text) hover:bg-[#eef3ec]",
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
