import { BrandLogo } from "@/components/brand/BrandLogo";
import Link from "next/link";
import type { ReactNode } from "react";

export function ConstructAuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(image:--gradient-primary-bg) px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(3,117,208,0.34),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_42%)]" />
      <div className="relative w-full max-w-md rounded-lg border border-[#7D9D76] bg-white/97 p-7 shadow-[0_24px_70px_rgba(3,35,29,.3)] backdrop-blur sm:p-9">
        <Link href="/" className="mb-7 inline-flex items-center gap-3">
          <BrandLogo />
          <span>
            {/* White backgrounds show the wordmark in PrimaryTextColor. */}
            <span className="block text-lg font-bold leading-tight text-(--color-primary-text)">
              Shaoor-AI Construct
            </span>
            <span className="block text-xs font-medium uppercase tracking-[0.18em] text-(--color-secondary-text-icon)">
              Construction websites
            </span>
          </span>
        </Link>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-secondary-text-icon)">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-(--color-primary-text)">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-7">{children}</div>
      </div>
    </main>
  );
}
