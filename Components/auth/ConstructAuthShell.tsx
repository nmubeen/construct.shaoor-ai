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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,74,123,0.35),transparent_40%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/95 p-7 shadow-2xl backdrop-blur sm:p-9">
        <Link href="/" className="mb-7 inline-flex items-center gap-3 text-slate-950">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#0E4A7B] to-teal-500 text-lg font-black text-white">S</span>
          <span>
            <span className="block text-lg font-bold leading-tight">Shaoor Construct</span>
            <span className="block text-xs font-medium uppercase tracking-[0.18em] text-teal-700">Construction websites</span>
          </span>
        </Link>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-7">{children}</div>
      </div>
    </main>
  );
}
