import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
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
  // PrimaryBackgroundColor (--gradient-primary-bg) — re-pointing the
  // variable retints this header along with every other one.
  return (
    <main className="min-h-screen overflow-hidden bg-(image:--gradient-primary-bg) text-white">
      <div className="absolute inset-x-0 top-0 h-160 bg-[radial-gradient(circle_at_20%_20%,rgba(3,117,208,.38),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,.14),transparent_38%)]" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="rounded-lg bg-white p-1.5 shadow-md">
            <Image
              src="/images/brand/shaoor-ai-construct-logo.png"
              alt="Shaoor-AI Construct"
              width={56}
              height={56}
              className="size-14 object-contain"
            />
          </span>
          <span>
            {/* PrimaryBackgroundColor backgrounds show the wordmark in white. */}
            <span className="block text-lg font-bold leading-tight text-white">
              Shaoor-AI Construct
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[.24em] text-(--color-secondary-text-icon)">
              by Shaoor AI Tech
            </span>
          </span>
        </Link>
        {/* ButtonBackgroundColor (--gradient-button-bg). */}
        <Link
          href="/account/login"
          className="rounded-md bg-(image:--gradient-button-bg) px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Customer sign in
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-8 lg:pb-28 lg:pt-24">
        <div className="max-w-4xl">
          {/* SecondaryBackgroundColor (--gradient-secondary-bg) — re-pointing
              the variable retints this badge and the Start a Trial box below. */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-(image:--gradient-secondary-bg) px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-white">
            <Sparkles className="size-4" />
            Construction websites, ready to manage
          </div>
          <h1 className="mt-7 text-5xl font-black leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
            A professional website and CMS built for construction companies.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Create a trial workspace with your own company address and start
            managing your website right away.
          </p>
        </div>

        <div className="mt-12 max-w-xl">
          <article className="group rounded-lg border border-white/30 bg-(image:--gradient-secondary-bg) p-7 shadow-2xl sm:p-9">
            <div className="flex size-13 items-center justify-center rounded-md bg-white/12 text-white">
              <Building2 className="size-6" />
            </div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-white/80">
              Create your own workspace
            </p>
            <h2 className="mt-2 text-3xl font-bold">Start a Trial</h2>
            <p className="mt-4 leading-7 text-slate-100">
              Sign in, create your organization, and prepare a private website
              workspace controlled by the Trial plan.
            </p>
            {/* ButtonBackgroundColor (--gradient-button-bg). */}
            <Link
              href="/account/login"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-(image:--gradient-button-bg) px-5 py-3 font-bold text-white transition hover:brightness-110"
            >
              Start trial setup <ArrowRight className="size-4" />
            </Link>
          </article>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-[#f5f7f4] text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-(--color-secondary-text-icon)">
              One managed platform
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-(--color-primary-text)">
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
                className="rounded-lg border border-[#7D9D76] bg-white p-5 shadow-[0_8px_24px_rgba(9,65,54,.06)]"
              >
                <span className="mb-4 grid size-9 place-items-center rounded-md bg-[#eef3ec] text-(--color-primary-text)">
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
