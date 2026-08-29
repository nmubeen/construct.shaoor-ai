import { websiteDesign } from "@/components/website/shared/design";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  align?: "left" | "center";
  inverse?: boolean;
}

export default function SectionHeader({
  title,
  subtitle,
  eyebrow,
  align = "center",
  inverse = false,
}: SectionHeaderProps) {
  const centered = align === "center";
  const eyebrowClass = inverse
    ? "text-sm font-semibold uppercase tracking-[0.25em] text-accent"
    : websiteDesign.sectionEyebrow;
  const titleClass = inverse
    ? "mt-3 text-3xl font-bold text-white md:text-4xl"
    : `${websiteDesign.sectionTitle}${centered ? "" : " mt-3"}`;
  const subtitleClass = inverse
    ? "mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-200 md:text-lg"
    : websiteDesign.sectionSubtitle;

  return (
    <div className={centered ? websiteDesign.sectionHeaderWrap : "mb-12 max-w-3xl"}>
      {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}

      <h2 className={titleClass}>
        {title}
      </h2>

      {subtitle && <p className={subtitleClass}>{subtitle}</p>}
    </div>
  );
}
