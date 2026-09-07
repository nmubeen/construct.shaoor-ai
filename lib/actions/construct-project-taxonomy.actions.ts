"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { ensureConstructProjectTaxonomySeeded, TAXONOMY_KINDS, type TaxonomyKind } from "@/lib/services/construct-project-taxonomy.service";

function requireEditor(role: string) {
  if (role === "VIEWER") redirect("/dashboard/content?error=You do not have permission to manage content.");
}

const kindSchema = z.enum(TAXONOMY_KINDS);
// Uppercased and length-capped here, not left to the caller: these values
// go straight onto public project cards, so "less than 20 characters" and
// "always uppercase" are enforced at the one place they're written, not
// hoped for at every place they're displayed.
const valueSchema = z.string().trim().min(1, "Enter a value.").max(19, "Must be under 20 characters.").transform((value) => value.toUpperCase());

export async function createConstructProjectTaxonomyAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  await ensureConstructProjectTaxonomySeeded(context.organizationId);

  const kindParsed = kindSchema.safeParse(formData.get("kind"));
  if (!kindParsed.success) redirect("/dashboard/content?error=Invalid list.");
  const kind: TaxonomyKind = kindParsed.data;
  const valueParsed = valueSchema.safeParse(formData.get("value"));
  if (!valueParsed.success) redirect(`/dashboard/content?error=${encodeURIComponent(valueParsed.error.issues[0]?.message ?? "Invalid value.")}`);

  const prisma = getConstructPrisma();
  const existing = await prisma.projectTaxonomy.findUnique({ where: { organizationId_kind_value: { organizationId: context.organizationId, kind, value: valueParsed.data } } });
  if (existing) redirect(`/dashboard/content?error=${encodeURIComponent(`"${valueParsed.data}" already exists.`)}`);

  const [{ _max }] = await Promise.all([
    prisma.projectTaxonomy.aggregate({ where: { organizationId: context.organizationId, kind }, _max: { sortOrder: true } }),
  ]);
  await prisma.projectTaxonomy.create({
    data: { organizationId: context.organizationId, kind, value: valueParsed.data, sortOrder: (_max.sortOrder ?? -1) + 1 },
  });
  revalidatePath("/dashboard/content");
  revalidatePath("/dashboard/projects/new");
  redirect("/dashboard/content?saved=1");
}

export async function deleteConstructProjectTaxonomyAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const kindParsed = kindSchema.safeParse(formData.get("kind"));
  const value = String(formData.get("value") ?? "");
  if (!kindParsed.success || !value) redirect("/dashboard/content?error=Invalid value.");
  const kind: TaxonomyKind = kindParsed.data;
  const prisma = getConstructPrisma();

  const inUse = kind === "CATEGORY"
    ? await prisma.project.count({ where: { organizationId: context.organizationId, category: value } })
    : await prisma.project.count({ where: { organizationId: context.organizationId, status: value } });
  if (inUse > 0) redirect(`/dashboard/content?error=${encodeURIComponent(`"${value}" is used by ${inUse} project(s) — reassign them first.`)}`);

  await prisma.projectTaxonomy.deleteMany({ where: { organizationId: context.organizationId, kind, value } });
  revalidatePath("/dashboard/content");
  revalidatePath("/dashboard/projects/new");
  redirect("/dashboard/content?deleted=1");
}
