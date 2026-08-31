import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const capabilities = [
  "Construction-focused website templates",
  "Projects, services, teams and enquiries",
  "Plan-controlled CMS access",
  "Your own Construct subdomain",
];

export function ConstructPortalHome() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#094136] text-white">
      <div className="absolute inset-x-0 top-0 h-160 bg-[radial-gradient(circle_at_20%_20%,rgba(125,157,118,.38),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,.14),transparent_38%)]" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#7D9D76] text-lg font-black shadow-lg shadow-black/20">
            S
          </span>
          <span>
            <span className="block text-lg font-bold leading-tight">
              Shaoor Construct
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[.24em] text-[#c9d8c6]">
              by Shaoor AI Tech
            </span>
          </span>
        </Link>
        <Link
          href="/account/login"
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
        >
          Customer sign in
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-8 lg:pb-28 lg:pt-24">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b9cdb5]/30 bg-[#7D9D76]/20 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-[#dce7d9]">
            <Sparkles className="size-4" />
            Construction websites, ready to manage
          </div>
          <h1 className="mt-7 text-5xl font-black leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
            A professional website and CMS built for construction companies.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Explore the complete experience through our Demo, or create a trial
            workspace with your own company address.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="group rounded-3xl border border-white/12 bg-white/8 p-7 shadow-2xl backdrop-blur-md sm:p-9">
            <div className="flex size-13 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-300">
              <Eye className="size-6" />
            </div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-[#b9cdb5]">
              Explore without signing up
            </p>
            <h2 className="mt-2 text-3xl font-bold">See the Demo</h2>
            <p className="mt-4 leading-7 text-slate-300">
              Browse the public construction website or take a read-only tour of
              the administration CMS.
            </p>
            <Link
              href="/demo"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-[#094136] transition group-hover:bg-[#dce7d9]"
            >
              Choose a Demo <ArrowRight className="size-4" />
            </Link>
          </article>

          <article className="group rounded-3xl border border-[#b9cdb5]/30 bg-gradient-to-br from-[#7D9D76]/75 to-[#062f27]/80 p-7 shadow-2xl sm:p-9">
            <div className="flex size-13 items-center justify-center rounded-2xl bg-white/12 text-white">
              <Building2 className="size-6" />
            </div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-[#dce7d9]">
              Create your own workspace
            </p>
            <h2 className="mt-2 text-3xl font-bold">Start a Trial</h2>
            <p className="mt-4 leading-7 text-slate-200">
              Sign in, create your organization, and prepare a private website
              workspace controlled by the Trial plan.
            </p>
            <Link
              href="/account/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-[#094136] transition group-hover:bg-[#dce7d9]"
            >
              Start trial setup <ArrowRight className="size-4" />
            </Link>
          </article>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-[#f5f7f4] text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7D9D76]">
              One managed platform
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Everything needed to present and operate your website.
            </h2>
            <p className="mt-5 leading-7 text-slate-600">
              Construct keeps the public site and its CMS together while Shaoor
              AI controls commercial access and plan limits centrally.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-[#dce5da] bg-white p-5 shadow-[0_8px_24px_rgba(9,65,54,.06)]"
              >
                <span className="mb-4 grid size-9 place-items-center rounded-xl bg-[#eef3ec] text-[#094136]">
                  {index === 1 ? (
                    <LayoutDashboard className="size-4" />
                  ) : index === 2 ? (
                    <ShieldCheck className="size-4" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </span>
                <p className="font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
