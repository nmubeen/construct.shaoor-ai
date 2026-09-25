import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";

// The exact shape written into ProposalRevision.snapshot at publish time,
// and the only thing the public route ever reads — never a live join, so
// a later edit to the org's branding/services/working-copy Proposal
// fields can't silently change what a customer already has a link to.
//
// Deliberately omits Project.client and Project.budget even when a
// portfolio project has them set — the product spec requires those
// (and any other optional sensitive project field) be included only
// when explicitly selected, and v1's editor has no per-field toggle for
// that, so the safe default is to never carry them into a snapshot.
export type ProposalSnapshot = {
  reference: string;
  title: string;
  revisionNumber: number;
  publishedAt: string;
  customerName: string;
  introduction: string;
  requirementsSummary: string;
  scopeOfWork: string;
  exclusions: string;
  assumptions: string;
  closingMessage: string;
  indicativeTimeline: string | null;
  pricing:
    | { mode: "DISCUSS" }
    | { mode: "FIXED"; amountMinor: number; currency: string; basis: string | null; taxNote: string | null }
    | { mode: "RANGE"; minAmountMinor: number; maxAmountMinor: number; currency: string; basis: string | null; taxNote: string | null };
  expiresAt: string | null;
  branding: {
    companyName: string;
    logoUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
    phone: string;
    email: string;
    whatsApp: string | null;
    website: string | null;
  };
  portfolio: Array<{
    projectId: string;
    title: string;
    category: string;
    location: string;
    year: number;
    description: string;
    coverImageUrl: string | null;
    highlights: string[];
    galleryImageUrls: string[];
    reason: string | null;
  }>;
  testimonials: Array<{
    clientName: string;
    company: string | null;
    designation: string | null;
    rating: number;
    testimonial: string;
    photoUrl: string | null;
  }>;
};

export async function buildConstructProposalSnapshot(proposalId: string, revisionNumber: number): Promise<ProposalSnapshot> {
  const prisma = getConstructPrisma();
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: {
      enquiry: { select: { name: true } },
      portfolioItems: {
        orderBy: { sortOrder: "asc" },
        include: { project: { include: { highlights: { orderBy: { sortOrder: "asc" } }, galleryItems: { orderBy: { sortOrder: "asc" } } } } },
      },
      testimonialItems: { orderBy: { sortOrder: "asc" }, include: { testimonial: true } },
    },
  });

  const settings = await prisma.siteSettings.findUnique({ where: { organizationId: proposal.organizationId } });

  const pricing: ProposalSnapshot["pricing"] =
    proposal.priceMode === "FIXED" && proposal.priceAmountMinor !== null
      ? { mode: "FIXED", amountMinor: proposal.priceAmountMinor, currency: proposal.priceCurrency, basis: proposal.pricingBasis, taxNote: proposal.taxNote }
      : proposal.priceMode === "RANGE" && proposal.priceMinAmountMinor !== null && proposal.priceMaxAmountMinor !== null
        ? { mode: "RANGE", minAmountMinor: proposal.priceMinAmountMinor, maxAmountMinor: proposal.priceMaxAmountMinor, currency: proposal.priceCurrency, basis: proposal.pricingBasis, taxNote: proposal.taxNote }
        : { mode: "DISCUSS" };

  return {
    reference: proposal.reference,
    title: proposal.title,
    revisionNumber,
    publishedAt: new Date().toISOString(),
    customerName: proposal.enquiry.name,
    introduction: proposal.introduction,
    requirementsSummary: proposal.requirementsSummary,
    scopeOfWork: proposal.scopeOfWork,
    exclusions: proposal.exclusions,
    assumptions: proposal.assumptions,
    closingMessage: proposal.closingMessage,
    indicativeTimeline: proposal.indicativeTimeline,
    pricing,
    expiresAt: proposal.expiresAt ? proposal.expiresAt.toISOString() : null,
    branding: {
      companyName: settings?.companyName ?? "",
      logoUrl: settings?.logoUrl ?? null,
      primaryColor: settings?.themePrimaryColor ?? null,
      accentColor: settings?.themeAccentColor ?? null,
      phone: settings?.phone ?? "",
      email: settings?.email ?? "",
      whatsApp: settings?.whatsApp ?? null,
      website: settings?.website ?? null,
    },
    portfolio: proposal.portfolioItems.map((item) => ({
      projectId: item.project.id,
      title: item.project.title,
      category: item.project.category,
      location: item.project.location,
      year: item.project.year,
      description: item.project.description,
      coverImageUrl: item.project.coverImageUrl,
      highlights: item.project.highlights.map((h) => h.text),
      galleryImageUrls: item.project.galleryItems.map((g) => g.imageUrl),
      reason: item.reason,
    })),
    testimonials: proposal.testimonialItems.map((item) => ({
      clientName: item.testimonial.clientName,
      company: item.testimonial.company,
      designation: item.testimonial.designation,
      rating: item.testimonial.rating,
      testimonial: item.testimonial.testimonial,
      photoUrl: item.testimonial.photoUrl,
    })),
  };
}
