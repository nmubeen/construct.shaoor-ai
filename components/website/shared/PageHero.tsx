import Link from "next/link";

import { websiteDesign } from "@/components/website/shared/design";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export default function PageHero({
  title,
  subtitle,
  description,
  backHref,
  backLabel,
}: PageHeroProps) {
  return (
    <section className={websiteDesign.pageHero}>
      <div className={websiteDesign.pageHeroOverlay} />

      <div className={websiteDesign.pageHeroInner}>
        {backHref && backLabel && (
          <Link href={backHref} className="inline-flex text-slate-300 transition hover:text-white">
            {backLabel}
          </Link>
        )}

        {subtitle && <p className={websiteDesign.pageHeroSubtitle}>{subtitle}</p>}

        <h1 className={websiteDesign.pageHeroTitle}>{title}</h1>

        {description && <p className={websiteDesign.pageHeroDescription}>{description}</p>}
      </div>
    </section>
  );
}
