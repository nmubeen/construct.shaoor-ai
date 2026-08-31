import Link from "next/link";
import {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type Variant = "primary" | "secondary" | "outline";

type BaseProps = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
};

type LinkButtonProps = BaseProps & {
  href: string;
};

type ActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> &
  BaseProps & {
    href?: never;
  };

type ButtonProps = LinkButtonProps | ActionButtonProps;

export default function Button(props: ButtonProps) {
  const {
    children,
    className = "",
    variant = "primary",
  } = props;

  const baseClasses =
    "inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold shadow-sm transition duration-300";

  const variantClasses: Record<Variant, string> = {
    primary:
      "bg-[#094136] text-white hover:-translate-y-0.5 hover:bg-[#7D9D76] hover:shadow-md",

    secondary:
      "bg-[#7D9D76] text-white hover:bg-[#094136]",

    outline:
      "border-2 border-[#7D9D76] bg-transparent text-[#094136] hover:bg-[#eef3ec]",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

if ("href" in props && typeof props.href === "string") {
  return (
    <Link
      href={props.href}
      className={classes}
    >
      {children}
    </Link>
  );
}

  const {
    type = "button",
    href,
    ...buttonProps
  } = props;

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
