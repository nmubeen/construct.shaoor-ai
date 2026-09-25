import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";

export type SetupGuideItem = { label: string; met: boolean; required: boolean; href: string };
export type SetupGuideStep = { key: string; title: string; description: string; items: SetupGuideItem[] };

const filled = (value: string | null | undefined) => Boolean(value && value.trim().length > 0);

// Powers /dashboard/guide — an interactive walkthrough of Website Setup
// Guide.md's steps 2-7 (step 1, "sign in and create the organization", is
// moot once someone's already looking at their dashboard). Every item's
// `met` is computed live from real data rather than a manually-ticked
// checkbox, same philosophy as getConstructPublishChecklist (which this
// deliberately doesn't call into — that one is a narrower "what would a
// visitor see as broken" publish gate; this is a broader onboarding tour,
// and duplicating a handful of `filled(settings.x)` checks here is
// simpler than reshaping that function's output to fit two different
// groupings).
export async function getConstructSetupGuideSteps(organizationId: string): Promise<SetupGuideStep[]> {
  const prisma = getConstructPrisma();
  const [
    settings,
    seo,
    primaryDomain,
    serviceCounts,
    projectCounts,
    activeQuestionCount,
    highlightCount,
    faqCount,
    nonOwnerMemberCount,
    publication,
  ] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { organizationId } }),
    prisma.seoSettings.findUnique({ where: { organizationId } }),
    prisma.domain.findFirst({ where: { organizationId, isPrimary: true, status: "ACTIVE" } }),
    prisma.service.groupBy({ by: ["isSample"], where: { organizationId }, _count: { _all: true } }),
    prisma.project.groupBy({ by: ["isSample"], where: { organizationId }, _count: { _all: true } }),
    prisma.serviceEnquiryQuestion.count({ where: { organizationId, isActive: true } }),
    prisma.whyChooseUsHighlight.count({ where: { organizationId } }),
    prisma.faq.count({ where: { organizationId, isActive: true } }),
    prisma.membership.count({ where: { organizationId, role: { not: "OWNER" }, status: { in: ["ACTIVE", "INVITED"] } } }),
    prisma.sitePublication.findUnique({ where: { organizationId } }),
  ]);

  const realServices = serviceCounts.find((row) => !row.isSample)?._count._all ?? 0;
  const sampleServices = serviceCounts.find((row) => row.isSample)?._count._all ?? 0;
  const realProjects = projectCounts.find((row) => !row.isSample)?._count._all ?? 0;
  const sampleProjects = projectCounts.find((row) => row.isSample)?._count._all ?? 0;

  return [
    {
      key: "company",
      title: "Company info & branding",
      description: "Your public name, contact details and theme — used across the header, footer, homepage and every contact link.",
      items: [
        { label: "Contact email set", met: filled(settings?.email), required: true, href: "/dashboard/site" },
        { label: "Contact phone set", met: filled(settings?.phone), required: true, href: "/dashboard/site" },
        { label: "Address (city and country) set", met: filled(settings?.city) && filled(settings?.country), required: true, href: "/dashboard/site" },
        { label: "Logo uploaded", met: filled(settings?.logoUrl), required: false, href: "/dashboard/site" },
        { label: "Favicon uploaded", met: filled(settings?.faviconUrl), required: false, href: "/dashboard/site" },
        { label: "Theme colours customised", met: filled(settings?.themePrimaryColor) || filled(settings?.themeAccentColor), required: false, href: "/dashboard/settings" },
      ],
    },
    {
      key: "homepage",
      title: "Homepage & company story",
      description: "The hero, call to action and About section visitors see first, plus the supporting proof — highlights and FAQs.",
      items: [
        { label: "Homepage hero photo set (otherwise a stock photo shows)", met: filled(settings?.heroImageUrl), required: false, href: "/dashboard/site" },
        { label: "Call-to-action button linked", met: filled(settings?.ctaButtonLink), required: false, href: "/dashboard/site" },
        { label: "About / company story written", met: filled(settings?.aboutStory), required: false, href: "/dashboard/site" },
        { label: "At least one \"Why choose us\" highlight added", met: highlightCount > 0, required: false, href: "/dashboard/content" },
        { label: "At least one FAQ added", met: faqCount > 0, required: false, href: "/dashboard/content" },
      ],
    },
    {
      key: "services-projects",
      title: "Services & projects",
      description: "What you actually offer, and the work you've delivered — replace the starter catalogue and sample projects with your own before launch.",
      items: [
        { label: "At least one real service added", met: realServices > 0, required: true, href: "/dashboard/services" },
        { label: sampleServices > 0 ? `No sample services left (${sampleServices} still marked “Sample”)` : "No sample services left", met: sampleServices === 0, required: false, href: "/dashboard/services" },
        { label: "At least one real project added", met: realProjects > 0, required: false, href: "/dashboard/projects" },
        { label: sampleProjects > 0 ? `No sample projects left (${sampleProjects} still marked “Sample”)` : "No sample projects left", met: sampleProjects === 0, required: false, href: "/dashboard/projects" },
      ],
    },
    {
      key: "enquiries",
      title: "Enquiry form",
      description: "The questions a visitor answers when enquiring about a specific service, beyond the name/phone/email every enquiry already collects.",
      items: [
        { label: "At least one enquiry question active on a service", met: activeQuestionCount > 0, required: false, href: "/dashboard/services" },
      ],
    },
    {
      key: "reach",
      title: "Team, search & domain",
      description: "Who else can manage this workspace, how your site is found, and your own web address.",
      items: [
        { label: "At least one colleague invited", met: nonOwnerMemberCount > 0, required: false, href: "/dashboard/team" },
        { label: "Search keywords reviewed", met: filled(seo?.defaultKeywords), required: false, href: "/dashboard/seo" },
        { label: "Custom domain connected", met: Boolean(primaryDomain), required: false, href: "/dashboard/settings" },
      ],
    },
    {
      key: "publish",
      title: "Publish",
      description: "Make the site visible at your address. You can unpublish or return to draft any time from Settings.",
      items: [
        { label: "Website published", met: publication?.status === "PUBLISHED", required: true, href: "/dashboard/settings" },
      ],
    },
  ];
}
