import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";

export const TAXONOMY_KINDS = ["CATEGORY", "STATUS"] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

const DEFAULT_CATEGORIES = ["RESIDENTIAL", "COMMERCIAL"];
const DEFAULT_STATUSES = ["PLANNING", "ONGOING", "PAUSED", "CANCELLED", "COMPLETED"];

// Lazy-provisioned the same way as site settings / SEO defaults elsewhere
// in this app: seeds once per kind, the first time either list is read
// for an organization, rather than at signup.
export async function ensureConstructProjectTaxonomySeeded(organizationId: string) {
  const prisma = getConstructPrisma();
  const existing = await prisma.projectTaxonomy.findMany({ where: { organizationId }, select: { kind: true } });
  const seededKinds = new Set(existing.map((row) => row.kind));

  const toSeed: { organizationId: string; kind: string; value: string; sortOrder: number }[] = [];
  if (!seededKinds.has("CATEGORY")) toSeed.push(...DEFAULT_CATEGORIES.map((value, index) => ({ organizationId, kind: "CATEGORY", value, sortOrder: index })));
  if (!seededKinds.has("STATUS")) toSeed.push(...DEFAULT_STATUSES.map((value, index) => ({ organizationId, kind: "STATUS", value, sortOrder: index })));

  if (toSeed.length > 0) await prisma.projectTaxonomy.createMany({ data: toSeed, skipDuplicates: true });
}

export async function getConstructProjectTaxonomy(organizationId: string) {
  await ensureConstructProjectTaxonomySeeded(organizationId);
  const rows = await getConstructPrisma().projectTaxonomy.findMany({
    where: { organizationId },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { value: "asc" }],
  });
  return {
    categories: rows.filter((row) => row.kind === "CATEGORY").map((row) => row.value),
    statuses: rows.filter((row) => row.kind === "STATUS").map((row) => row.value),
  };
}
