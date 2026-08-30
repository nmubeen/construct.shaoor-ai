import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Eye, LayoutDashboard } from "lucide-react";

export const metadata: Metadata = {
  title: "Choose a Demo | Shaoor Construct",
  description:
    "Explore the Shaoor Construct website and read-only CMS demonstration.",
  robots: { index: false, follow: false },
};

export default function DemoChoicePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-5 py-10 text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.24),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,74,123,.45),transparent_42%)]" />
      <div className="relative mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to Construct
        </Link>
        <div className="mx-auto max-w-2xl pb-10 pt-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-teal-300">
            Explore the platform
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Which Demo would you like to see?
          </h1>
          <p className="mt-5 leading-7 text-slate-300">
            The website demonstrates the visitor experience. The CMS tour shows
            how a construction company controls its content.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <a
            href="https://demo.construct.shaoor-ai.com"
            className="group rounded-3xl border border-white/12 bg-white/8 p-8 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/12"
          >
            <span className="grid size-13 place-items-center rounded-2xl bg-teal-300/15 text-teal-300">
              <Eye className="size-6" />
            </span>
            <h2 className="mt-7 text-2xl font-bold">Main Website</h2>
            <p className="mt-3 leading-7 text-slate-300">
              Browse the Demo Construction Company website as a prospective
              customer would.
            </p>
            <span className="mt-8 inline-flex items-center gap-2 font-bold text-teal-300">
              Open website{" "}
              <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </a>
          <Link
            href="/demo/cms"
            className="group rounded-3xl border border-white/12 bg-white/8 p-8 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/12"
          >
            <span className="grid size-13 place-items-center rounded-2xl bg-blue-300/15 text-blue-200">
              <LayoutDashboard className="size-6" />
            </span>
            <h2 className="mt-7 text-2xl font-bold">Admin CMS</h2>
            <p className="mt-3 leading-7 text-slate-300">
              Review the CMS structure and Demo workspace in a protected
              read-only presentation.
            </p>
            <span className="mt-8 inline-flex items-center gap-2 font-bold text-teal-300">
              Open CMS tour{" "}
              <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
        <p className="mt-8 text-center text-sm text-slate-400">
          Demo access never permits changes to website data.
        </p>
      </div>
    </main>
  );
}
