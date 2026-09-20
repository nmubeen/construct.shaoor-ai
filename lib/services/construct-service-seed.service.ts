import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_SERVICE_IMAGE_BASE64, SAMPLE_SERVICE_IMAGE_HEIGHT, SAMPLE_SERVICE_IMAGE_WIDTH } from "@/lib/services/construct-sample-service-image";

// Sourced from Seed/Services.xml (a 15-service, 10-sub-service-each
// construction company catalogue) — parsed once and pasted here as
// static data rather than parsed at runtime, since it never changes.
// Every field already fits the limits saveConstructServiceAction
// enforces (checked against all 15 before this was written): title <=120,
// shortDescription 10-300, description 20-10000, seoTitle <=160,
// seoDescription <=320, seoKeywords <=500, subServices <=10.
export type DefaultServiceSeed = {
  title: string;
  slug: string;
  subServices: string[];
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

export const DEFAULT_CONSTRUCT_SERVICES: DefaultServiceSeed[] = [
  { title: "Building Construction", slug: "building-construction", subServices: ["Independent Houses & Villas", "Residential Buildings", "Apartments", "Commercial Buildings", "Office Buildings", "Shops & Showrooms", "Warehouses & Sheds", "Schools & Institutional Buildings", "Turnkey Construction", "Building Extensions & Additional Floors"], shortDescription: "End-to-end construction of homes, apartments, offices, and commercial buildings, from foundation to finishing.", description: "We deliver complete building construction services covering independent houses, villas, apartments, and residential complexes, along with commercial, office, and institutional buildings. Our turnkey construction model manages design, materials, labour, and quality control under one roof, so clients get a single point of accountability from groundbreaking to handover. We also handle building extensions and additional floors on existing structures, matching new work to the original design and structural capacity.", seoTitle: "Building Construction Services | Homes, Apartments & Commercial", seoDescription: "Turnkey building construction for villas, apartments, offices, shops, warehouses & schools. Reliable quality, on-time handover & building extensions.", seoKeywords: "building construction, house construction, villa construction, apartment construction, commercial building construction, turnkey construction, office building construction, building extension, additional floor construction, institutional buildings" },
  { title: "Renovation & Remodeling", slug: "renovation-and-remodeling", subServices: ["Complete Home Renovation", "Office & Commercial Renovation", "Kitchen Renovation", "Bathroom Renovation", "Building Refurbishment", "Structural Alterations", "Flooring Replacement", "Ceiling Renovation", "Painting & Repainting", "Building Extension Works"], shortDescription: "Complete home and office renovation, from kitchens and bathrooms to full structural remodeling.", description: "Our renovation and remodeling services refresh and reconfigure homes, offices, and commercial spaces of any age. We handle complete home and office renovations, targeted kitchen and bathroom remodeling, and building refurbishment for tired or damaged structures. Where a space needs more than a facelift, our team carries out structural alterations, flooring replacement, ceiling renovation, and building extension works, finished with expert painting and repainting to bring the property back to a like-new standard.", seoTitle: "Renovation & Remodeling Services | Home & Office Makeovers", seoDescription: "Home, kitchen, bathroom & office renovation services. Structural alterations, flooring, ceiling renovation & repainting handled by one experienced team.", seoKeywords: "home renovation, office renovation, kitchen renovation, bathroom renovation, building refurbishment, structural alterations, flooring replacement, ceiling renovation, repainting services, remodeling contractor" },
  { title: "Civil & Structural Works", slug: "civil-and-structural-works", subServices: ["RCC Works", "Foundations & Footings", "Brickwork & Blockwork", "Plastering", "Structural Steel Works", "Concrete Flooring", "Compound & Boundary Walls", "Retaining Walls", "Structural Repairs & Strengthening", "Demolition Works"], shortDescription: "RCC works, foundations, brickwork, and structural repairs that form the backbone of every build.", description: "Our civil and structural works team handles the foundational engineering that every construction project depends on, including RCC works, foundations and footings, and brickwork and blockwork. We carry out plastering, structural steel works, and concrete flooring to specification, along with compound, boundary, and retaining walls. For existing structures, we provide structural repairs and strengthening to restore load-bearing capacity, and manage demolition works safely when a site needs to be cleared for new construction.", seoTitle: "Civil & Structural Works | RCC, Foundations & Structural Repairs", seoDescription: "Expert civil and structural works: RCC, foundations, brickwork, plastering, structural steel, retaining walls, structural strengthening & demolition.", seoKeywords: "civil works, structural works, RCC construction, foundation work, brickwork, plastering services, structural steel works, retaining wall construction, structural strengthening, demolition works" },
  { title: "Interior & Fit-Out Works", slug: "interior-and-fit-out-works", subServices: ["Residential Interiors", "Office Interiors", "Shop & Showroom Fit-Outs", "False Ceilings", "Gypsum & Partition Works", "Carpentry & Woodwork", "Modular Kitchens", "Wardrobes & Storage", "Interior Painting", "Decorative Finishes"], shortDescription: "Residential and commercial interior fit-outs, from modular kitchens to false ceilings and carpentry.", description: "We design and execute interior and fit-out works for homes, offices, shops, and showrooms, translating a space's purpose into a finished, functional interior. Services include false ceilings, gypsum and partition works, and custom carpentry and woodwork, along with modular kitchens and wardrobes built to fit each space. Interior painting and decorative finishes complete the look, giving residential and commercial clients a coordinated interior delivered by one team.", seoTitle: "Interior & Fit-Out Works | Residential & Commercial Interiors", seoDescription: "Interior fit-out services for homes, offices & showrooms: false ceilings, partitions, modular kitchens, wardrobes, carpentry & decorative finishes.", seoKeywords: "interior fit-out, residential interiors, office interiors, showroom fit-out, false ceiling work, modular kitchen, gypsum partition, carpentry work, interior painting, decorative finishes" },
  { title: "Flooring, Tiling & Stone Works", slug: "flooring-tiling-and-stone-works", subServices: ["Vitrified Tile Flooring", "Ceramic Tile Works", "Marble Flooring", "Granite Flooring", "Kota Stone Flooring", "Wooden / Laminate Flooring", "Bathroom & Kitchen Tiling", "Wall Cladding", "Staircase Stone Works", "Outdoor & Parking Tiles"], shortDescription: "Vitrified, ceramic, marble, granite, and wooden flooring for interiors, bathrooms, and outdoor areas.", description: "Our flooring, tiling, and stone works cover every surface a building needs, from vitrified and ceramic tile flooring to marble, granite, and Kota stone installations. We also install wooden and laminate flooring, bathroom and kitchen tiling, and wall cladding for interior and exterior finishes. For durability in high-traffic and outdoor zones, we complete staircase stone works and outdoor and parking tile installations to a precise, long-lasting finish.", seoTitle: "Flooring, Tiling & Stone Works | Vitrified, Marble & Granite", seoDescription: "Flooring & tiling services: vitrified tiles, marble, granite, Kota stone, wooden flooring, wall cladding & outdoor tiling for homes and offices.", seoKeywords: "flooring services, tiling contractor, vitrified tile flooring, marble flooring, granite flooring, Kota stone flooring, wall cladding, bathroom tiling, outdoor tiling, wooden flooring" },
  { title: "Electrical Works", slug: "electrical-works", subServices: ["Complete Building Electrification", "Electrical Wiring & Rewiring", "Switches & Socket Installation", "Lighting Installation", "Electrical Panels & Distribution Boards", "Earthing", "Inverter & UPS Wiring", "Generator Wiring", "CCTV & Security Wiring", "Data & Network Cabling"], shortDescription: "Complete building electrification, wiring, panels, and security and network cabling.", description: "We provide complete electrical works for new and existing buildings, including full building electrification, wiring and rewiring, and switch and socket installation. Our team designs and installs lighting, electrical panels, and distribution boards, along with earthing systems for safety compliance. We also handle inverter, UPS, and generator wiring, plus CCTV, security, and data and network cabling, so a property's power and connectivity needs are covered in one scope.", seoTitle: "Electrical Works | Wiring, Panels & Building Electrification", seoDescription: "Licensed electrical works: building electrification, wiring, lighting, distribution panels, earthing, generator wiring, CCTV & network cabling.", seoKeywords: "electrical works, building electrification, electrical wiring, lighting installation, distribution panel installation, earthing work, generator wiring, CCTV wiring, network cabling, electrical contractor" },
  { title: "Plumbing & Sanitary Works", slug: "plumbing-and-sanitary-works", subServices: ["Water Supply Plumbing", "Drainage & Sewerage", "Bathroom Plumbing", "Sanitaryware Installation", "Kitchen Plumbing", "Water Tank Installation", "Pumps & Motors", "Rainwater Drainage", "Plumbing Repairs", "Water Leakage Rectification"], shortDescription: "Water supply, drainage, bathroom plumbing, and sanitaryware installation for homes and buildings.", description: "Our plumbing and sanitary works cover water supply plumbing, drainage and sewerage systems, and bathroom and kitchen plumbing for residential and commercial projects. We install sanitaryware, water tanks, pumps, and motors, and set up rainwater drainage systems to manage runoff effectively. When issues arise, our team also handles plumbing repairs and water leakage rectification to protect the building's structure and interiors.", seoTitle: "Plumbing & Sanitary Works | Water Supply, Drainage & Repairs", seoDescription: "Plumbing services: water supply, drainage, bathroom & kitchen plumbing, sanitaryware installation, water tanks, pumps & leakage rectification.", seoKeywords: "plumbing services, sanitary works, water supply plumbing, drainage services, bathroom plumbing, sanitaryware installation, water tank installation, plumbing repairs, water leakage rectification, pump installation" },
  { title: "Waterproofing & Roof Works", slug: "waterproofing-and-roof-works", subServices: ["Terrace Waterproofing", "Bathroom Waterproofing", "Basement Waterproofing", "Water Tank Waterproofing", "Roof Waterproofing", "Roof Repair", "Dampness Treatment", "Crack Sealing", "Heat / Thermal Insulation", "Protective Coatings"], shortDescription: "Terrace, bathroom, and basement waterproofing along with roof repair and dampness treatment.", description: "We protect buildings from water damage with comprehensive waterproofing and roof works, including terrace, bathroom, basement, and water tank waterproofing. Our roof waterproofing and roof repair services address leaks and wear before they cause structural damage. We also carry out dampness treatment, crack sealing, heat and thermal insulation, and protective coatings, giving buildings lasting protection against moisture and weather.", seoTitle: "Waterproofing & Roof Works | Terrace, Basement & Roof Repair", seoDescription: "Waterproofing services for terraces, bathrooms, basements & roofs, plus dampness treatment, crack sealing & thermal insulation coatings.", seoKeywords: "waterproofing services, terrace waterproofing, bathroom waterproofing, basement waterproofing, roof waterproofing, roof repair, dampness treatment, crack sealing, thermal insulation, protective coatings" },
  { title: "Painting & Finishing Works", slug: "painting-and-finishing-works", subServices: ["Interior Painting", "Exterior Painting", "Texture Painting", "Wall Putty", "Primer & Finishing", "Enamel Painting", "Waterproof Exterior Coatings", "Wood Polishing", "Metal Painting", "Repainting & Maintenance"], shortDescription: "Interior and exterior painting, texture finishes, and wood and metal polishing services.", description: "Our painting and finishing works cover interior and exterior painting, texture painting, and wall putty application for a smooth, lasting base coat. We use quality primers and finishing coats, including enamel painting and waterproof exterior coatings built to withstand weather. The team also provides wood polishing and metal painting, plus repainting and maintenance packages to keep a property looking its best year after year.", seoTitle: "Painting & Finishing Works | Interior, Exterior & Texture Painting", seoDescription: "Interior & exterior painting, texture finishes, wall putty, enamel painting, waterproof coatings, wood polishing & repainting services.", seoKeywords: "painting services, interior painting, exterior painting, texture painting, wall putty application, enamel painting, waterproof exterior coating, wood polishing, metal painting, repainting contractor" },
  { title: "Doors, Glass & Fabrication", slug: "doors-glass-and-fabrication", subServices: ["Wooden Doors & Windows", "uPVC Doors & Windows", "Aluminium Doors & Windows", "Glass Doors & Partitions", "Toughened Glass Works", "MS Fabrication", "Stainless Steel Fabrication", "Railings & Handrails", "Grills & Gates", "Roofing Sheds & Canopies"], shortDescription: "Wooden, uPVC, and aluminium doors and windows, glass partitions, and steel fabrication.", description: "We supply and install wooden, uPVC, and aluminium doors and windows for residential and commercial buildings, along with glass doors, partitions, and toughened glass works for a modern finish. Our fabrication division handles MS and stainless steel fabrication, including railings, handrails, grills, and gates. We also design and build roofing sheds and canopies, combining structural fabrication with functional and aesthetic finishing.", seoTitle: "Doors, Glass & Fabrication Works | Windows, Railings & Sheds", seoDescription: "Doors & windows in wood, uPVC & aluminium, glass partitions, toughened glass, steel fabrication, railings, grills, gates & roofing sheds.", seoKeywords: "doors and windows, uPVC doors, aluminium windows, glass partitions, toughened glass work, MS fabrication, stainless steel fabrication, railings and handrails, grills and gates, roofing sheds" },
  { title: "External & Site Development", slug: "external-and-site-development", subServices: ["Site Clearing & Levelling", "Excavation & Earthwork", "Internal Roads", "Driveways", "Parking Areas", "Paver Blocks", "Footpaths & Kerbs", "Stormwater Drains", "Compound Walls & Gates", "External Lighting"], shortDescription: "Site clearing, excavation, internal roads, driveways, and stormwater drainage for new sites.", description: "Our external and site development services prepare and finish the land around a building, starting with site clearing, levelling, excavation, and earthwork. We construct internal roads, driveways, and parking areas using paver blocks, along with footpaths, kerbs, and stormwater drains for proper drainage. Compound walls, gates, and external lighting complete the site, giving properties a secure, well-finished exterior.", seoTitle: "External & Site Development | Roads, Driveways & Site Works", seoDescription: "Site development services: clearing, excavation, internal roads, driveways, paver block parking, stormwater drains, compound walls & lighting.", seoKeywords: "site development, site clearing, excavation works, internal road construction, driveway construction, paver block parking, stormwater drainage, compound wall construction, external lighting, earthwork" },
  { title: "Landscaping & Outdoor Works", slug: "landscaping-and-outdoor-works", subServices: ["Garden Development", "Lawn Development", "Hard Landscaping", "Walkways", "Pergolas & Gazebos", "Outdoor Seating", "Irrigation Systems", "Outdoor Lighting", "Water Features", "Terrace Gardens"], shortDescription: "Garden and lawn development, hard landscaping, irrigation, and outdoor lighting design.", description: "We create outdoor spaces that complement a building's design through garden and lawn development, hard landscaping, and walkway construction. Our landscaping team adds pergolas, gazebos, and outdoor seating areas for functional, inviting spaces, backed by irrigation systems that keep gardens healthy with minimal upkeep. Outdoor lighting, water features, and terrace gardens round out the design, turning unused outdoor areas into an extension of the living or working space.", seoTitle: "Landscaping & Outdoor Works | Gardens, Lawns & Outdoor Living", seoDescription: "Landscaping services: garden & lawn development, hard landscaping, pergolas, irrigation systems, outdoor lighting, water features & terrace gardens.", seoKeywords: "landscaping services, garden development, lawn development, hard landscaping, pergola construction, irrigation system installation, outdoor lighting, water features, terrace garden, outdoor design" },
  { title: "Repair & Maintenance", slug: "repair-and-maintenance", subServices: ["Civil Repairs", "Plumbing Repairs", "Electrical Repairs", "Waterproofing Repairs", "Roof Repairs", "Painting & Touch-Ups", "Tile & Flooring Repairs", "Door & Window Repairs", "Common Area Maintenance", "Annual Maintenance Contracts"], shortDescription: "Civil, plumbing, electrical, and waterproofing repairs plus annual maintenance contracts.", description: "Our repair and maintenance services keep buildings running smoothly long after construction is complete. We handle civil, plumbing, and electrical repairs, along with waterproofing and roof repairs to address leaks and damage before they worsen. Painting touch-ups, tile and flooring repairs, and door and window repairs restore a property's finish, while our common area maintenance and annual maintenance contracts give owners a dependable, ongoing upkeep plan.", seoTitle: "Repair & Maintenance Services | Civil, Plumbing & Electrical", seoDescription: "Repair & maintenance services: civil, plumbing, electrical & waterproofing repairs, tile and flooring fixes, plus annual maintenance contracts.", seoKeywords: "repair and maintenance, civil repairs, plumbing repairs, electrical repairs, waterproofing repairs, roof repair, tile and flooring repair, door and window repair, annual maintenance contract, common area maintenance" },
  { title: "Design & Pre-Construction", slug: "design-and-pre-construction", subServices: ["Architectural Planning", "Floor Plans", "Structural Design", "3D Elevation & Visualization", "Interior Design", "Site Survey", "Quantity Estimation", "BOQ Preparation", "Cost Estimation", "Construction Planning"], shortDescription: "Architectural planning, floor plans, 3D elevations, and cost and quantity estimation.", description: "Before construction begins, our design and pre-construction team develops architectural plans, floor plans, and structural designs tailored to the client's needs and site conditions. We produce 3D elevations and visualizations along with interior design concepts, so clients can see the finished project before ground is broken. Supporting services include site surveys, quantity estimation, BOQ preparation, cost estimation, and detailed construction planning to keep the project on budget and on schedule.", seoTitle: "Design & Pre-Construction Services | Planning, 3D & Estimation", seoDescription: "Architectural planning, floor plans, structural design, 3D elevations, site survey, BOQ preparation & cost estimation before construction starts.", seoKeywords: "architectural planning, floor plan design, structural design, 3D elevation, interior design, site survey, quantity estimation, BOQ preparation, cost estimation, construction planning" },
  { title: "Project Management", slug: "project-management", subServices: ["Construction Project Management", "Site Supervision", "Planning & Scheduling", "Cost & Budget Control", "Contractor Coordination", "Vendor Coordination", "Material Procurement", "Quality Control", "Safety Management", "Progress Monitoring & Reporting"], shortDescription: "Site supervision, scheduling, cost control, and coordination for smooth project delivery.", description: "Our project management services oversee construction from start to finish, providing site supervision along with detailed planning and scheduling to keep work on track. We manage cost and budget control, contractor and vendor coordination, and material procurement so resources are available when needed. Ongoing quality control, safety management, and progress monitoring and reporting keep clients informed and projects accountable at every stage.", seoTitle: "Construction Project Management | Site Supervision & Cost Control", seoDescription: "Project management services: site supervision, scheduling, cost & budget control, contractor coordination, quality control & progress reporting.", seoKeywords: "construction project management, site supervision, project scheduling, cost and budget control, contractor coordination, vendor coordination, material procurement, quality control, safety management, progress reporting" },
];

const BUCKET = "construct-media";
const SAMPLE_IMAGE_FILE_NAME = "sample-service-image.png";

// Raw SQL: construct.media_folders exists in Postgres but the generated
// client here couldn't be regenerated (dev server holds the query engine
// binary locked on Windows) — switch to typed prisma.mediaFolder calls
// once a client regen picks it up. Get-or-create, top-level, by name.
async function ensureServicesFolder(organizationId: string): Promise<string> {
  const prisma = getConstructPrisma();
  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM construct.media_folders WHERE organization_id = ${organizationId}::uuid AND path = 'services'
  `;
  if (existing.length > 0) return existing[0].id;
  const created = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO construct.media_folders (organization_id, name, parent_id, path)
    VALUES (${organizationId}::uuid, 'Services', NULL, 'services')
    ON CONFLICT (organization_id, path) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;
  return created[0].id;
}

// One shared "sample image" for all default services, instead of a
// generated image per service. Created on first use and reused by name
// afterwards, so re-running the seed (or the remaining steps after a
// failure) never uploads a second copy. Replacing a service's image in
// the dashboard just points that service at something else; the shared
// file stays for the others.
async function getOrCreateSampleImageUrl(organizationId: string, folderId: string): Promise<string> {
  const prisma = getConstructPrisma();
  const existing = await prisma.media.findFirst({
    where: { organizationId, originalName: SAMPLE_IMAGE_FILE_NAME },
    select: { url: true },
  });
  if (existing) return existing.url;

  const supabase = await createClient();
  const buffer = Buffer.from(SAMPLE_SERVICE_IMAGE_BASE64, "base64");
  const storagePath = `${organizationId}/services/${crypto.randomUUID()}-${SAMPLE_IMAGE_FILE_NAME}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: "image/png",
    upsert: false,
  });
  if (uploadError) throw new Error(`Could not upload the sample image: ${uploadError.message}`);

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  try {
    const media = await prisma.media.create({
      data: {
        organizationId,
        fileName: SAMPLE_IMAGE_FILE_NAME,
        originalName: SAMPLE_IMAGE_FILE_NAME,
        storagePath,
        url: publicData.publicUrl,
        folder: "services",
        mimeType: "image/png",
        extension: "png",
        fileSize: buffer.byteLength,
        width: SAMPLE_SERVICE_IMAGE_WIDTH,
        height: SAMPLE_SERVICE_IMAGE_HEIGHT,
        type: "IMAGE",
        title: "Sample service image (replace with your own)",
      },
    });
    // folderId isn't on the generated client's Media input yet (same
    // regen block noted throughout this feature) — set it directly.
    await prisma.$executeRaw`UPDATE construct.media SET folder_id = ${folderId}::uuid WHERE id = ${media.id}::uuid`;
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw error;
  }
  return publicData.publicUrl;
}

export function getConstructDefaultServiceSeedTotal() {
  return DEFAULT_CONSTRUCT_SERVICES.length;
}

export type SeedStartResult = { started: true; total: number; titles: string[] } | { started: false; reason: "not-empty" };

// No "already seeded" flag by design: a tenant who deletes every service
// back down to zero and wants to start over from the defaults again
// should be able to — this stays available for as long as the table is
// actually empty, not strictly once per organization's lifetime. Checked
// once, up front, rather than before every step — see
// seedConstructDefaultServiceAtIndex for why a step doesn't repeat it.
export async function startConstructDefaultServiceSeed(organizationId: string): Promise<SeedStartResult> {
  const existingCount = await getConstructPrisma().service.count({ where: { organizationId } });
  if (existingCount > 0) return { started: false, reason: "not-empty" };
  return { started: true, total: DEFAULT_CONSTRUCT_SERVICES.length, titles: DEFAULT_CONSTRUCT_SERVICES.map((service) => service.title) };
}

export type SeedStepResult =
  | { ok: true; title: string; index: number; total: number }
  | { ok: false; error: string };

// One item's worth of work from the old all-or-nothing seedConstructDefaultServices()
// — split out so the caller (seedConstructDefaultServiceStepAction) can run
// the 15 items one at a time across separate requests, giving the browser
// something to show progress against instead of one long, silent request.
// Idempotent by slug rather than wrapped in the old bulk function's
// upload/delete rollback: a step that fails partway (say, item 9 of 15)
// leaves items 1-8 in place instead of unwinding them, and a retry from
// item 0 skips anything already created rather than erroring on it — a
// simpler and more forgiving recovery story than an all-or-nothing rollback.
export async function seedConstructDefaultServiceAtIndex(organizationId: string, index: number): Promise<SeedStepResult> {
  const seed = DEFAULT_CONSTRUCT_SERVICES[index];
  if (!seed) return { ok: false, error: "Invalid step." };

  const prisma = getConstructPrisma();

  const already = await prisma.service.findUnique({
    where: { organizationId_slug: { organizationId, slug: seed.slug } },
    select: { id: true },
  });
  if (already) return { ok: true, title: seed.title, index, total: DEFAULT_CONSTRUCT_SERVICES.length };

  try {
    const folderId = await ensureServicesFolder(organizationId);
    const imageUrl = await getOrCreateSampleImageUrl(organizationId, folderId);

    await prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          organizationId,
          title: seed.title,
          slug: seed.slug,
          shortDescription: seed.shortDescription,
          description: seed.description,
          imageUrl,
          displayOrder: index,
          isActive: true,
          seoTitle: seed.seoTitle,
          seoDescription: seed.seoDescription,
          seoKeywords: seed.seoKeywords,
        },
      });

      // Raw SQL: same SubService regen note as elsewhere in this feature —
      // switch to tx.subService.createMany once available.
      for (const [subIndex, text] of seed.subServices.entries()) {
        await tx.$executeRaw`INSERT INTO construct.sub_services (organization_id, service_id, text, sort_order) VALUES (${organizationId}::uuid, ${service.id}::uuid, ${text}, ${subIndex})`;
      }
    });

    return { ok: true, title: seed.title, index, total: DEFAULT_CONSTRUCT_SERVICES.length };
  } catch (error) {
    console.error(`Seeding "${seed.title}" (step ${index + 1}) failed:`, error);
    return { ok: false, error: `Could not create "${seed.title}". ${error instanceof Error ? error.message : ""}`.trim() };
  }
}
