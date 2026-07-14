"use client";

import Link from "next/link";
import {
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  ReactNode,
} from "react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "success"
  | "ghost";

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  fullWidth?: boolean;
  className?: string;
}

type LinkButtonProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type NormalButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type ButtonProps = LinkButtonProps | NormalButtonProps;

function isLinkButtonProps(
  props: ButtonProps
): props is LinkButtonProps {
  return typeof props.href === "string";
}

export default function Button(props: ButtonProps) {
  const {
    children,
    variant = "primary",
    fullWidth = false,
    className = "",
  } = props;

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

  const classes = `
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
  `;

  if (isLinkButtonProps(props)) {
    const {
      href,
      children: _children,
      variant: _variant,
      fullWidth: _fullWidth,
      className: _className,
      ...linkProps
    } = props;

    return (
      <Link
        href={href}
        className={classes}
        {...linkProps}
      >
        {children}
      </Link>
    );
  }

  const {
    children: _children,
    variant: _variant,
    fullWidth: _fullWidth,
    className: _className,
    ...buttonProps
  } = props;

  return (
    <button
      className={classes}
      {...buttonProps}
    >
      {children}
    </button>
  );
}