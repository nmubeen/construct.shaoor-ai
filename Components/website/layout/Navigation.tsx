"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/lib/site";

interface NavigationProps {
  vertical?: boolean;
  onNavigate?: () => void;
}

export default function Navigation({
  vertical = false,
  onNavigate,
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
              active
                ? "font-semibold text-[var(--primary)]"
                : "text-[var(--foreground)] hover:text-[var(--primary)]"
            }`}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}