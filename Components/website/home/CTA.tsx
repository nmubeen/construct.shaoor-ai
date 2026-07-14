import Link from "next/link";

import { siteConfig } from "@/lib/site";

export default function CTA() {
  return (
    <section className="bg-linear-to-r from-(--primary) to-slate-900 py-24 text-white">
      <div className="mx-auto max-w-5xl px-6 text-center">

        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-(--accent)">
          Let's Build Together
        </span>

        <h2 className="mt-6 text-4xl font-bold md:text-5xl">
          {siteConfig.cta.title}
        </h2>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          {siteConfig.cta.subtitle}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-5">

          <Link
            href={siteConfig.cta.buttonLink}
            className="rounded-lg bg-(--accent) px-8 py-4 font-semibold text-black transition hover:brightness-95"
          >
            {siteConfig.cta.buttonText}
          </Link>

          <a
            href={`tel:${siteConfig.company.phone}`}
            className="rounded-lg border border-white px-8 py-4 font-semibold transition hover:bg-white hover:text-(--primary)"
          >
            Call Now
          </a>

        </div>

      </div>
    </section>
  );
}