export const websiteDesign = {
  container: "mx-auto max-w-7xl px-5 sm:px-8",
  sectionY: "py-16 md:py-24",
  sectionHeaderWrap: "mx-auto mb-12 max-w-3xl text-center md:mb-16",
  // Eyebrow = the small kicker label above a section title: styled as the
  // sub-heading color sitewide.
  sectionEyebrow: "text-sm font-semibold uppercase tracking-[0.25em] text-(--brand-sage)",
  sectionTitle: "mt-3 text-3xl font-bold text-(--primary) md:text-4xl",
  sectionSubtitle: "mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg",
  pageHero: "relative overflow-hidden bg-linear-to-b from-[#094136] to-black text-white",
  pageHeroOverlay: "absolute inset-0 bg-linear-to-br from-[#094136]/40 via-transparent to-black/60",
  pageHeroInner: "relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24",
  pageHeroSubtitle: "text-sm font-semibold uppercase tracking-[0.3em] text-accent",
  pageHeroTitle: "mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl",
  pageHeroDescription: "mt-5 max-w-3xl text-base leading-8 text-slate-200 md:text-lg",
  card: "overflow-hidden rounded-lg border border-[#7D9D76] bg-white shadow-[0_8px_24px_rgba(9,65,54,.07)] transition duration-300 hover:-translate-y-1 hover:border-[#094136] hover:shadow-[0_18px_48px_rgba(9,65,54,.12)]",
  cardBody: "p-6",
  cardTitle: "text-2xl font-bold text-(--primary)",
  cardText: "text-slate-600",
  primaryButton: "inline-flex items-center justify-center rounded-md bg-[#094136] px-8 py-4 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#7D9D76] hover:shadow-lg",
  secondaryButton: "inline-flex items-center justify-center rounded-md border border-[#7D9D76] px-8 py-4 font-semibold text-[#094136] transition hover:bg-[#eef3ec]",
} as const;
