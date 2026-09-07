import "server-only";

import { cache } from "react";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { resolvePublicConstructOrganization } from "@/lib/construct-public-tenant";
import { prisma as legacyPrisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { ensureConstructSiteSettingsDefaults } from "@/lib/services/construct-site-settings.service";

export type PublicSiteSettings = Awaited<ReturnType<typeof getSiteSettings>> & {
  // Per-tenant public-website theme — null means "use Shaoor's defaults".
  themePrimaryColor: string | null;
  themeAccentColor: string | null;
  whyChooseUsTitle: string;
  whyChooseUsSubtitle: string;
};

export type PublicService = { id: string | number; title: string; slug: string; shortDescription: string; description: string; image: string | null; icon: string | null; displayOrder: number; isActive: boolean; seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null; canonicalUrl: string | null; createdAt: Date; updatedAt: Date; subServices: string[] };
export type PublicProject = { id: string | number; slug: string; title: string; category: string; status: string; client: string; location: string; year: number; duration: string; budget: string; area: string; coverImage: string | null; description: string; featured: boolean; seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null; canonicalUrl: string | null; createdAt: Date; updatedAt: Date; gallery: Array<{ id: string | number; image: string; altText?: string | null }>; highlights: Array<{ id: string | number; text: string }> };
export type PublicTeamMember = { id: string | number; name: string; slug: string; designation: string; shortBio: string; photo: string; email: string | null; phone: string | null; linkedin: string | null; instagram: string | null; twitter: string | null; displayOrder: number; showOnHomepage: boolean; isActive: boolean; seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null; canonicalUrl: string | null; createdAt: Date; updatedAt: Date };
export type PublicClient = { id: string | number; name: string; slug: string; logo: string | null; website: string | null; category: string | null; description: string | null; displayOrder: number; featured: boolean; active: boolean };
export type PublicTestimonial = { id: string | number; clientName: string; company: string | null; designation: string | null; photo: string | null; rating: number; testimonial: string; projectName: string | null; featured: boolean; active: boolean; displayOrder: number };
export type PublicFaq = { id: string | number; question: string; answer: string; category: string | null; displayOrder: number; featured: boolean; active: boolean };

function mapService(item: { id: string; title: string; slug: string; shortDescription: string; description: string; imageUrl: string | null; icon: string | null; displayOrder: number; isActive: boolean; seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null; canonicalUrl: string | null; createdAt: Date; updatedAt: Date }): PublicService { return { ...item, image: item.imageUrl, subServices: [] }; }

// Raw, not the typed client: SubService exists in Postgres but the
// generated client here couldn't be regenerated (dev server holds the
// query engine binary locked on Windows) — switch to an `include` on the
// service queries below once a client regen picks the model up. One
// query for all of an organization's sub-services rather than one per
// service, since these public-data functions can return several at once.
async function attachSubServices(organizationId: string, services: PublicService[]): Promise<PublicService[]> {
  if (services.length === 0) return services;
  const rows = await getConstructPrisma().$queryRaw<{ service_id: string; text: string }[]>`
    SELECT service_id, text FROM construct.sub_services WHERE organization_id = ${organizationId}::uuid ORDER BY sort_order ASC
  `;
  const bySer = new Map<string, string[]>();
  for (const row of rows) bySer.set(row.service_id, [...(bySer.get(row.service_id) ?? []), row.text]);
  return services.map((service) => ({ ...service, subServices: bySer.get(String(service.id)) ?? [] }));
}
function mapProject(item: { id: string; slug: string; title: string; category: string; status: string; client: string; location: string; year: number; duration: string; budget: string; area: string; coverImageUrl: string | null; description: string; featured: boolean; seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null; canonicalUrl: string | null; createdAt: Date; updatedAt: Date; galleryItems: Array<{ id: string; imageUrl: string; altText: string | null }>; highlights: Array<{ id: string; text: string }> }): PublicProject { return { ...item, coverImage: item.coverImageUrl, gallery: item.galleryItems.map(image => ({ id: image.id, image: image.imageUrl, altText: image.altText })) }; }

// Cached: called independently by Header, Footer, WebsiteStructuredData and
// the theme <style> injection — without this, that's 4 redundant DB round
// trips (on top of resolvePublicConstructOrganization's own) every single
// page load.
const DEFAULT_WHY_CHOOSE_US_TITLE = "Building with Confidence";
const DEFAULT_WHY_CHOOSE_US_SUBTITLE = "Every project is backed by professional expertise, disciplined execution, and a commitment to delivering exceptional results.";

export const getPublicSiteSettings = cache(async (): Promise<PublicSiteSettings> => {
  const organization = await resolvePublicConstructOrganization();
  if (!organization) {
    const legacy = await getSiteSettings();
    return { ...legacy, themePrimaryColor: null, themeAccentColor: null, whyChooseUsTitle: DEFAULT_WHY_CHOOSE_US_TITLE, whyChooseUsSubtitle: DEFAULT_WHY_CHOOSE_US_SUBTITLE };
  }
  const settings = await ensureConstructSiteSettingsDefaults(organization.id);
  // Raw SQL for why_choose_us_title/subtitle: exist in Postgres but the
  // generated client here couldn't be regenerated (dev server holds the
  // query engine binary locked on Windows) — fold these into the typed
  // settings object above once a client regen picks them up.
  const [whyChooseUs] = await getConstructPrisma().$queryRaw<{ title: string; subtitle: string }[]>`
    SELECT why_choose_us_title AS title, why_choose_us_subtitle AS subtitle FROM construct.site_settings WHERE organization_id = ${organization.id}::uuid
  `;
  return {
    id: 0, companyId: 0, companyName: settings.companyName, tagline: settings.tagline, description: settings.description, logo: settings.logoUrl, favicon: settings.faviconUrl,
    phone: settings.phone, email: settings.email, website: settings.website, addressLine1: settings.addressLine1, addressLine2: settings.addressLine2, city: settings.city, state: settings.state, country: settings.country, postalCode: settings.postalCode,
    facebook: settings.facebook, instagram: settings.instagram, linkedin: settings.linkedin, youtube: settings.youtube, twitter: settings.twitter,
    heroTitle: settings.heroTitle, heroSubtitle: settings.heroSubtitle, heroImage: settings.heroImageUrl, ctaTitle: settings.ctaTitle, ctaSubtitle: settings.ctaSubtitle, ctaButtonText: settings.ctaButtonText, ctaButtonLink: settings.ctaButtonLink,
    projectsCompleted: settings.projectsCompleted, clientsServed: settings.clientsServed, yearsExperience: settings.yearsExperience, employees: settings.employees,
    seoTitle: "", seoDescription: "", seoKeywords: "", whatsApp: settings.whatsApp, googleMapsUrl: settings.googleMapsUrl, aboutTitle: settings.aboutTitle, aboutSubtitle: settings.aboutSubtitle, aboutStory: settings.aboutStory,
    missionTitle: settings.missionTitle, missionDescription: settings.missionDescription, visionTitle: settings.visionTitle, visionDescription: settings.visionDescription, aboutImage: settings.aboutImageUrl,
    createdAt: settings.createdAt, updatedAt: settings.updatedAt,
    themePrimaryColor: settings.themePrimaryColor, themeAccentColor: settings.themeAccentColor,
    whyChooseUsTitle: whyChooseUs?.title ?? DEFAULT_WHY_CHOOSE_US_TITLE, whyChooseUsSubtitle: whyChooseUs?.subtitle ?? DEFAULT_WHY_CHOOSE_US_SUBTITLE,
  };
});

// Cached: WhyChooseUs.tsx is the only reader, but public-site-data's
// functions are cache()-wrapped uniformly across this file regardless of
// current call count, so a second call site later doesn't silently
// reintroduce a duplicate query.
export const getPublicWhyChooseUsHighlights = cache(async () => {
  const organization = await resolvePublicConstructOrganization();
  if (!organization) return [];
  const { getConstructWhyChooseUsHighlights } = await import("@/lib/services/construct-why-choose-us.service");
  return getConstructWhyChooseUsHighlights(organization.id);
});

export const getPublicServices = cache(async () => {
  const organization = await resolvePublicConstructOrganization();
  if (!organization) return (await legacyPrisma.service.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } })).map((item) => ({ ...item, subServices: [] as string[] }));
  const items = await getConstructPrisma().service.findMany({ where: { organizationId: organization.id, isActive: true }, orderBy: { displayOrder: "asc" } });
  return attachSubServices(organization.id, items.map(mapService));
});
export const getPublicServiceBySlug = cache(async (slug: string) => {
  const organization = await resolvePublicConstructOrganization();
  if (!organization) { const item = await legacyPrisma.service.findFirst({ where: { slug } }); return item ? { ...item, subServices: [] as string[] } : null; }
  const item = await getConstructPrisma().service.findFirst({ where: { organizationId: organization.id, slug } });
  if (!item) return null;
  const [withSubServices] = await attachSubServices(organization.id, [mapService(item)]);
  return withSubServices;
});
export const getRelatedPublicServices = cache(async (id: string | number, take = 3) => {
  const organization = await resolvePublicConstructOrganization();
  if (!organization) return (await legacyPrisma.service.findMany({ where: { isActive: true, id: { not: Number(id) } }, orderBy: { displayOrder: "asc" }, take })).map((item) => ({ ...item, subServices: [] as string[] }));
  const items = await getConstructPrisma().service.findMany({ where: { organizationId: organization.id, isActive: true, id: { not: String(id) } }, orderBy: { displayOrder: "asc" }, take });
  return attachSubServices(organization.id, items.map(mapService));
});

export const getPublicProjects = cache(async (filters?: { status?: string; featured?: boolean; category?: string; take?: number }) => {
  const organization = await resolvePublicConstructOrganization();
  if (!organization) return legacyPrisma.project.findMany({ where: { ...(filters?.status ? { status: filters.status } : {}), ...(filters?.featured !== undefined ? { featured: filters.featured } : {}), ...(filters?.category ? { category: filters.category } : {}) }, include: { gallery: { orderBy: { id: "asc" } }, highlights: { orderBy: { id: "asc" } } }, orderBy: { year: "desc" }, take: filters?.take });
  const prisma = getConstructPrisma();
  // Raw SQL for is_active: exists in Postgres but the generated client
  // here couldn't be regenerated (dev server holds the query engine
  // binary locked on Windows) — restrict the typed query to active ids
  // (applied before `take`, so a hidden project never displaces a real
  // result) until a client regen picks the field up, then fold this
  // straight into the where clause below.
  const activeRows = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM construct.projects WHERE organization_id = ${organization.id}::uuid AND is_active = true`;
  const activeIds = activeRows.map((row) => row.id);
  if (activeIds.length === 0) return [];
  const items = await prisma.project.findMany({ where: { organizationId: organization.id, id: { in: activeIds }, ...(filters?.status ? { status: filters.status } : {}), ...(filters?.featured !== undefined ? { featured: filters.featured } : {}), ...(filters?.category ? { category: filters.category } : {}) }, include: { galleryItems: { orderBy: { sortOrder: "asc" } }, highlights: { orderBy: { sortOrder: "asc" } } }, orderBy: { year: "desc" }, take: filters?.take }); return items.map(mapProject);
});
export const getPublicProjectBySlug = cache(async (slug: string) => { const projects = await getPublicProjects(); return projects.find(project => project.slug === slug) ?? null; });
export const getRelatedPublicProjects = cache(async (project: PublicProject, take = 3) => { const projects = await getPublicProjects({ category: project.category }); return projects.filter(item => item.id !== project.id).slice(0, take); });

export const getPublicTeamMembers = cache(async () => { const organization = await resolvePublicConstructOrganization(); if (!organization) return legacyPrisma.teamMember.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }); const items = await getConstructPrisma().teamMember.findMany({ where: { organizationId: organization.id, isActive: true }, orderBy: { displayOrder: "asc" } }); return items.map(item => ({ ...item, photo: item.photoUrl })) satisfies PublicTeamMember[]; });
export const getPublicClients = cache(async (filters?: { featured?: boolean; take?: number }): Promise<PublicClient[]> => { const organization = await resolvePublicConstructOrganization(); if (!organization) return legacyPrisma.client.findMany({ where: { active: true, ...(filters?.featured !== undefined ? { featured: filters.featured } : {}) }, orderBy: { displayOrder: "asc" }, take: filters?.take }); const items = await getConstructPrisma().client.findMany({ where: { organizationId: organization.id, isActive: true, ...(filters?.featured !== undefined ? { featured: filters.featured } : {}) }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], take: filters?.take }); return items.map(item => ({ ...item, logo: item.logoUrl, active: item.isActive })); });
export const getPublicTestimonials = cache(async (filters?: { featured?: boolean; take?: number }): Promise<PublicTestimonial[]> => { const organization = await resolvePublicConstructOrganization(); if (!organization) return legacyPrisma.testimonial.findMany({ where: { active: true, ...(filters?.featured !== undefined ? { featured: filters.featured } : {}) }, orderBy: { displayOrder: "asc" }, take: filters?.take }); const items = await getConstructPrisma().testimonial.findMany({ where: { organizationId: organization.id, isActive: true, ...(filters?.featured !== undefined ? { featured: filters.featured } : {}) }, orderBy: [{ displayOrder: "asc" }, { clientName: "asc" }], take: filters?.take }); return items.map(item => ({ ...item, photo: item.photoUrl, active: item.isActive })); });
export const getPublicFaqs = cache(async (filters?: { featured?: boolean; take?: number }): Promise<PublicFaq[]> => { const organization = await resolvePublicConstructOrganization(); if (!organization) return legacyPrisma.fAQ.findMany({ where: { active: true, ...(filters?.featured !== undefined ? { featured: filters.featured } : {}) }, orderBy: { displayOrder: "asc" }, take: filters?.take }); const items = await getConstructPrisma().faq.findMany({ where: { organizationId: organization.id, isActive: true, ...(filters?.featured !== undefined ? { featured: filters.featured } : {}) }, orderBy: [{ displayOrder: "asc" }, { question: "asc" }], take: filters?.take }); return items.map(item => ({ ...item, active: item.isActive })); });
export const getPublicStats = cache(async () => { const organization = await resolvePublicConstructOrganization(); if (!organization) return Promise.all([legacyPrisma.project.count({ where: { status: "Completed" } }), legacyPrisma.client.count({ where: { active: true } }), legacyPrisma.service.count({ where: { isActive: true } }), legacyPrisma.teamMember.count({ where: { isActive: true } })]); const db = getConstructPrisma(); return Promise.all([db.project.count({ where: { organizationId: organization.id, status: "Completed" } }), db.client.count({ where: { organizationId: organization.id, isActive: true } }), db.service.count({ where: { organizationId: organization.id, isActive: true } }), db.teamMember.count({ where: { organizationId: organization.id, isActive: true } })]); });
