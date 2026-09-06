"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/lib/site";

interface NavigationProps {
  vertical?: boolean;
  onNavigate?: () => void;
  // Set when rendered over a dark background (the desktop header is now a
  // dark gradient) so links stay legible instead of using the default
  // dark-on-light text colors.
  inverse?: boolean;
}

export default function Navigation({
  vertical = false,
  onNavigate,
  inverse = false,
}: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className={
        vertical
          ? "flex flex-col gap-6"
          : "flex items-center gap-8"
      }
    >
      {siteConfig.navigation.map((item) => {
        const active =
  item.href === "/"
    ? pathname === "/"
    : pathname.startsWith(item.href);

        return (
          <Link
            key={item.title}
            href={item.href}
            onClick={onNavigate}
            className={`transition-colors duration-200 ${
              inverse
                ? active
                  ? "font-semibold text-[var(--site-accent)]"
                  : "text-white/85 hover:text-white"
                : active
                  ? "font-semibold text-[var(--site-primary)]"
                  : "text-[var(--foreground)] hover:text-[var(--site-primary)]"
            }`}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}