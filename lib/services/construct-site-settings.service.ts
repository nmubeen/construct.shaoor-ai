import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";

// Lazily provisions a default SiteSettings row. The signup DB trigger
// (construct.handle_new_user()) deliberately does NOT create this — its own
// comment says so, to keep that trigger's blast radius small — leaving it
// to be "lazily created on first dashboard visit" at the app level. Nothing
// actually did that: /dashboard/site and the SEO page both just threw
// "Something went wrong" for any organization that reached them before
// ever saving Website settings (every fresh trial signup). Upsert, not a
// bare findUnique-then-create: safe if two requests race to provision on
// first visit (e.g. this page and the SEO page's own ensureConstructSeoDefaults
// both landing at once) rather than the unique-constraint crash a plain
// .create() hit in exactly that scenario.
export async function ensureConstructSiteSettingsDefaults(organizationId: string) {
  const prisma = getConstructPrisma();
  const existing = await prisma.siteSettings.findUnique({ where: { organizationId } });
  if (existing) return existing;
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  return prisma.siteSettings.upsert({
    where: { organizationId },
    update: {},
    create: {
      organizationId,
      companyName: organization.name,
      tagline: "Building with confidence",
      description: `${organization.name} is a construction company website managed with Shaoor Construct.`,
      phone: "",
      email: "",
      addressLine1: "",
      city: "",
      country: "",
      heroTitle: `Welcome to ${organization.name}`,
      heroSubtitle: "Edit this from Website settings to introduce your company to visitors.",
      ctaTitle: "Discuss your next project",
      ctaSubtitle: "Tell us what you are planning and our team will get in touch.",
      ctaButtonText: "Contact us",
      ctaButtonLink: "/contact",
    },
  });
}
