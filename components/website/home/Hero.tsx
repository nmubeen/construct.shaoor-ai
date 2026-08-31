import Link from "next/link";
import Image from "next/image";
import type { PublicSiteSettings } from "@/lib/public-site-data";

interface HeroProps {
  settings: PublicSiteSettings;
}

export default function Hero({ settings }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#094136] text-white">
      <Image
        src={settings.heroImage || "/images/hero/hero-default.jpg"}
        alt={settings.heroTitle}
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-[#094136]/95 via-[#094136]/78 to-[#094136]/35" />
      <div className="relative z-10 mx-auto flex min-h-[36rem] max-w-7xl items-center px-5 py-20 sm:px-8 md:py-28">

        <div className="max-w-3xl">

          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-[#c7d7c3]">
            Building Excellence Since Day One
          </p>

          <h1 className="mb-7 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-7xl">
            {settings.heroTitle}
          </h1>

          <p className="mb-10 max-w-2xl text-lg leading-8 text-slate-200">
            {settings.heroSubtitle}
          </p>

          <div className="flex flex-wrap gap-5">



            <Link
              href="/contact"
              className="rounded-xl border border-white/80 bg-white px-8 py-4 font-semibold text-[#094136] shadow-lg transition hover:-translate-y-0.5 hover:border-[#7D9D76] hover:bg-[#7D9D76] hover:text-white"
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
