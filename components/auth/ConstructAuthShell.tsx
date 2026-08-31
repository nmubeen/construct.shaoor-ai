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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#094136] px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,157,118,0.34),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_42%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/97 p-7 shadow-[0_24px_70px_rgba(3,35,29,.3)] backdrop-blur sm:p-9">
        <Link href="/" className="mb-7 inline-flex items-center gap-3 text-slate-950">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#094136] text-lg font-black text-white">S</span>
          <span>
            <span className="block text-lg font-bold leading-tight">Shaoor Construct</span>
            <span className="block text-xs font-medium uppercase tracking-[0.18em] text-[#7D9D76]">Construction websites</span>
          </span>
        </Link>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7D9D76]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-7">{children}</div>
      </div>
    </main>
  );
}
