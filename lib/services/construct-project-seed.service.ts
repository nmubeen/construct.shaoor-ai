import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";
import { ensureConstructProjectTaxonomySeeded } from "@/lib/services/construct-project-taxonomy.service";
import { ensureServicesFolder, getOrCreateSampleImageUrl } from "@/lib/services/construct-service-seed.service";

// 2 sample projects — one built around the Building Construction service,
// one around Interior & Fit-Out Works — so a brand-new tenant's Projects
// page isn't empty on day one. Every field fits the limits
// saveConstructProjectAction enforces (title <=160, category/status
// 2-100/2-60, budget/duration/area <=80, description 20-20000, seoTitle
// <=160, seoDescription <=320, seoKeywords <=500).
export type DefaultProjectSeed = {
  title: string;
  slug: string;
  category: string;
  status: string;
  client: string;
  location: string;
  year: number;
  duration: string;
  budget: string;
  area: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  featured: boolean;
  highlights: string[];
};

export const DEFAULT_CONSTRUCT_PROJECTS: DefaultProjectSeed[] = [
  {
    title: "Meridian Heights — Turnkey Villa Construction",
    slug: "meridian-heights-villa-construction",
    category: "RESIDENTIAL",
    status: "COMPLETED",
    client: "Ramesh & Sunitha Iyer",
    location: "Sarjapur Road, Bengaluru",
    year: 2024,
    duration: "15 months",
    budget: "₹2.1 Cr",
    area: "4,800 sq ft (G+2, 4BHK)",
    description:
      "A complete turnkey build for a 4BHK family villa, taken from an empty plot to full handover under a single contract. Our team ran the site survey and soil testing, finalised structural drawings, and cast the foundation and footings before raising a G+2 RCC framed structure engineered to safely carry a future third floor. Brickwork, plastering, and internal/external electrical and plumbing rough-in followed, with terrace and bathroom waterproofing done ahead of flooring to rule out later leaks. Finishing covered vitrified tile flooring throughout, a modular kitchen, wardrobes in all bedrooms, uPVC windows, and a full interior and exterior paint scheme. As with every turnkey project, the client dealt with one point of contact for design, approvals, materials, labour, and quality checks from groundbreaking to the final walkthrough — no separate contractors to coordinate between.",
    seoTitle: "Meridian Heights Villa | Turnkey Construction Case Study",
    seoDescription: "See how we delivered a 4,800 sq ft turnkey villa in Sarjapur Road, Bengaluru — foundation to handover in 15 months, on a single-contract model.",
    seoKeywords: "turnkey villa construction, residential construction case study, Bengaluru villa builder, G+2 RCC construction, turnkey home construction",
    featured: true,
    highlights: [
      "Turnkey delivery — design, approvals, construction and finishing under one contract",
      "G+2 RCC framed structure engineered for a future third floor",
      "Terrace and bathroom waterproofing completed before flooring to prevent leaks",
      "Vitrified tile flooring, modular kitchen and wardrobes included in the finishing package",
      "Handed over 3 weeks ahead of the agreed 15-month schedule",
      "Zero major snag-list items raised at the final client walkthrough",
    ],
  },
  {
    title: "Nexora Business Park — Corporate Office Interior Fit-Out",
    slug: "nexora-business-park-office-fitout",
    category: "COMMERCIAL",
    status: "COMPLETED",
    client: "Nexora Technologies Pvt. Ltd.",
    location: "HITEC City, Hyderabad",
    year: 2025,
    duration: "4 months",
    budget: "₹68 Lakh",
    area: "12,500 sq ft",
    description:
      "A full interior fit-out for Nexora Technologies' new Hyderabad office, delivered inside a 4-month move-in deadline. The scope covered a 220-seat open workstation layout beneath an acoustic false ceiling, six glass-partitioned team cabins, and two AV-ready boardrooms with structured data and network cabling run before ceiling closure. A modular pantry and staff breakout lounge were built for informal meetings and downtime, and the reception and lobby were finished with branded signage, feature lighting, and decorative wall panelling to match the client's brand guidelines. Interior painting, gypsum partition work, and carpentry for storage and reception counters rounded out the scope, giving the client a single coordinated interior delivered on one schedule instead of piecing it together across separate vendors.",
    seoTitle: "Nexora Business Park | Corporate Office Fit-Out Case Study",
    seoDescription: "A 12,500 sq ft corporate interior fit-out in HITEC City, Hyderabad — workstations, cabins, boardrooms and a branded reception, delivered in 4 months.",
    seoKeywords: "office interior fit-out, corporate office interiors, commercial fit-out Hyderabad, workstation layout design, office cabin partitions",
    featured: true,
    highlights: [
      "220-seat open workstation layout beneath an acoustic false ceiling",
      "6 glass-partitioned team cabins and 2 AV-ready boardrooms",
      "Structured data and network cabling run before ceiling closure",
      "Modular pantry and staff breakout lounge",
      "Branded reception and lobby fit-out with feature lighting",
      "Delivered and handed over within the agreed 4-month fit-out window",
    ],
  },
];

export function getConstructDefaultProjectSeedTotal() {
  return DEFAULT_CONSTRUCT_PROJECTS.length;
}

export type SeedProjectStartResult = { started: true; total: number; titles: string[] } | { started: false; reason: "not-empty" };

// Same "no already-seeded flag" reasoning as startConstructDefaultServiceSeed
// — available for as long as the project list is actually empty, so a
// tenant who deletes both samples can pull them back.
export async function startConstructDefaultProjectSeed(organizationId: string): Promise<SeedProjectStartResult> {
  const existingCount = await getConstructPrisma().project.count({ where: { organizationId } });
  if (existingCount > 0) return { started: false, reason: "not-empty" };
  return { started: true, total: DEFAULT_CONSTRUCT_PROJECTS.length, titles: DEFAULT_CONSTRUCT_PROJECTS.map((project) => project.title) };
}

export type SeedProjectStepResult =
  | { ok: true; title: string; index: number; total: number }
  | { ok: false; error: string };

// One item's worth of work, mirroring seedConstructDefaultServiceAtIndex:
// idempotent by slug (a retry after a partial failure skips whatever
// already exists), reuses the same shared sample image the service seeder
// uploads (getOrCreateSampleImageUrl), and marks the row isSample so the
// dashboard can flag it and saveConstructProjectAction can clear the flag
// on the first real edit.
export async function seedConstructDefaultProjectAtIndex(organizationId: string, index: number): Promise<SeedProjectStepResult> {
  const seed = DEFAULT_CONSTRUCT_PROJECTS[index];
  if (!seed) return { ok: false, error: "Invalid step." };

  const prisma = getConstructPrisma();

  const already = await prisma.project.findUnique({
    where: { organizationId_slug: { organizationId, slug: seed.slug } },
    select: { id: true },
  });
  if (already) return { ok: true, title: seed.title, index, total: DEFAULT_CONSTRUCT_PROJECTS.length };

  try {
    const folderId = await ensureServicesFolder(organizationId);
    const imageUrl = await getOrCreateSampleImageUrl(organizationId, folderId);
    await ensureConstructProjectTaxonomySeeded(organizationId);

    await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          organizationId,
          title: seed.title,
          slug: seed.slug,
          category: seed.category,
          status: seed.status,
          client: seed.client,
          location: seed.location,
          year: seed.year,
          duration: seed.duration,
          budget: seed.budget,
          area: seed.area,
          coverImageUrl: imageUrl,
          description: seed.description,
          featured: seed.featured,
          isActive: true,
          isSample: true,
          seoTitle: seed.seoTitle,
          seoDescription: seed.seoDescription,
          seoKeywords: seed.seoKeywords,
        },
      });

      await tx.projectHighlight.createMany({
        data: seed.highlights.map((text, sortOrder) => ({ organizationId, projectId: project.id, text, sortOrder })),
      });

      await tx.projectGalleryItem.createMany({
        data: [{ organizationId, projectId: project.id, imageUrl, altText: seed.title, sortOrder: 0 }],
      });
    });

    return { ok: true, title: seed.title, index, total: DEFAULT_CONSTRUCT_PROJECTS.length };
  } catch (error) {
    console.error(`Seeding "${seed.title}" (step ${index + 1}) failed:`, error);
    return { ok: false, error: `Could not create "${seed.title}". ${error instanceof Error ? error.message : ""}`.trim() };
  }
}
