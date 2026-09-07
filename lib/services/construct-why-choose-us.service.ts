import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";

// Seeded from the hardcoded values WhyChooseUs.tsx shipped with before
// this became tenant-configurable — see the migration's comment for why
// title/subtitle themselves don't need this (a column DEFAULT already
// backfills every existing tenant; a list of related rows can't be
// seeded that way).
const DEFAULT_HIGHLIGHTS = [
  { icon: "building", title: "Comprehensive Expertise", description: "We deliver residential, commercial, industrial, and infrastructure projects with a strong focus on quality and execution." },
  { icon: "helmet", title: "Safety First", description: "Strict safety standards and best practices are followed throughout every stage of construction." },
  { icon: "clock", title: "On-Time Delivery", description: "Our experienced project management team ensures projects are completed on schedule without compromising quality." },
  { icon: "award", title: "Trusted Quality", description: "We are committed to delivering durable, sustainable, and high-quality construction solutions that exceed expectations." },
];

// Raw SQL: construct.why_choose_us_highlights exists in Postgres but the
// generated client here couldn't be regenerated (dev server holds the
// query engine binary locked on Windows) — switch to
// prisma.whyChooseUsHighlight.findMany/createMany once a client regen
// picks it up.
export async function ensureConstructWhyChooseUsSeeded(organizationId: string) {
  const prisma = getConstructPrisma();
  const [{ count }] = await prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS count FROM construct.why_choose_us_highlights WHERE organization_id = ${organizationId}::uuid`;
  if (count > 0) return;
  for (const [index, highlight] of DEFAULT_HIGHLIGHTS.entries()) {
    await prisma.$executeRaw`
      INSERT INTO construct.why_choose_us_highlights (organization_id, icon, title, description, sort_order)
      VALUES (${organizationId}::uuid, ${highlight.icon}, ${highlight.title}, ${highlight.description}, ${index})
      ON CONFLICT DO NOTHING
    `;
  }
}

export type WhyChooseUsHighlight = { id: string; icon: string; title: string; description: string };

export async function getConstructWhyChooseUsHighlights(organizationId: string): Promise<WhyChooseUsHighlight[]> {
  await ensureConstructWhyChooseUsSeeded(organizationId);
  return getConstructPrisma().$queryRaw<WhyChooseUsHighlight[]>`
    SELECT id, icon, title, description FROM construct.why_choose_us_highlights
    WHERE organization_id = ${organizationId}::uuid ORDER BY sort_order ASC
  `;
}
