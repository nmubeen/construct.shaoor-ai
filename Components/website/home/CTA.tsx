import Link from "next/link";
import { Settings } from "@prisma/client";

import { websiteDesign } from "@/components/website/shared/design";

type CTAProps = {
  settings: Settings;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  badge?: string;
};

export default function CTA({
  settings,
  title,
  subtitle,
  buttonText,
  buttonLink,
  badge,
}: CTAProps) {
  return (
    <section className="bg-linear-to-r from-primary to-slate-900 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6 text-center sm:px-8">

        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
          {badge || "Let's Build Together"}
        </span>

        <h2 className="mt-6 text-3xl font-bold md:text-5xl">
          {title || settings.ctaTitle}
        </h2>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          {subtitle || settings.ctaSubtitle}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-5">

          <Link
            href={buttonLink || settings.ctaButtonLink || "#"}
            className="rounded-lg bg-accent px-8 py-4 font-semibold text-black transition hover:brightness-95"
          >
            {buttonText || settings.ctaButtonText}
          </Link>

          {settings.phone && (
            <a
              href={`tel:${settings.phone}`}
              className={websiteDesign.secondaryButton + " border-white text-white hover:text-slate-900"}
            >
              Call Now
            </a>
          )}

        </div>

      </div>
    </section>
  );
}