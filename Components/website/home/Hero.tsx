import Link from "next/link";
import Image from "next/image";
import type { Settings } from "@prisma/client";

interface HeroProps {
  settings: Settings;
}

export default function Hero({ settings }: HeroProps) {
  return (
    <section className="relative overflow-hidden text-white">
      <Image
        src={settings.heroImage || "/images/hero/hero-default.jpg"}
        alt={settings.heroTitle}
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 mx-auto flex min-h-50 max-w-7xl items-center px-6 py-20">

        <div className="max-w-3xl">

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            Building Excellence Since Day One
          </p>

          <h1 className="mb-8 text-5xl font-extrabold leading-tight md:text-7xl">
            {settings.heroTitle}
          </h1>

          <p className="mb-10 max-w-2xl text-lg leading-8 text-slate-200">
            {settings.heroSubtitle}
          </p>

          <div className="flex flex-wrap gap-5">



            <Link
              href="/contact"
              className="rounded-lg border border-white px-8 py-4 font-semibold transition hover:bg-white hover:text-primary"
            >
              Get a Quote
            </Link>

          </div>

        </div>

      </div>

      {/* Decorative Shapes */}

      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

      <div className="absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-(--accent)/10 blur-3xl" />
    </section>
  );
}