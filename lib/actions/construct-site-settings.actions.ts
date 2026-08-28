"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

const optionalUrl = z.union([z.literal(""), z.string().url()]).transform((value) => value || null);
const settingsSchema = z.object({
  companyName: z.string().trim().min(2).max(100),
  tagline: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(2000),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  phone: z.string().trim().max(40),
  email: z.string().trim().email(),
  website: optionalUrl,
  addressLine1: z.string().trim().max(160),
  addressLine2: z.string().trim().max(160).transform((value) => value || null),
  city: z.string().trim().max(80),
  state: z.string().trim().max(80).transform((value) => value || null),
  country: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().max(20).transform((value) => value || null),
  facebook: optionalUrl,
  instagram: optionalUrl,
  linkedin: optionalUrl,
  youtube: optionalUrl,
  twitter: optionalUrl,
  heroTitle: z.string().trim().min(5).max(160),
  heroSubtitle: z.string().trim().min(5).max(400),
  heroImageUrl: optionalUrl,
  ctaTitle: z.string().trim().min(3).max(160),
  ctaSubtitle: z.string().trim().min(5).max(400),
  ctaButtonText: z.string().trim().min(2).max(60),
  ctaButtonLink: z.string().trim().min(1).max(300),
  projectsCompleted: z.coerce.number().int().min(0).max(100000),
  clientsServed: z.coerce.number().int().min(0).max(100000),
  yearsExperience: z.coerce.number().int().min(0).max(500),
  employees: z.coerce.number().int().min(0).max(100000),
  whatsApp: z.string().trim().max(40).transform((value) => value || null),
  googleMapsUrl: optionalUrl,
  aboutTitle: z.string().trim().max(160).transform((value) => value || null),
  aboutSubtitle: z.string().trim().max(400).transform((value) => value || null),
  aboutStory: z.string().trim().max(5000).transform((value) => value || null),
  missionTitle: z.string().trim().max(160).transform((value) => value || null),
  missionDescription: z.string().trim().max(2000).transform((value) => value || null),
  visionTitle: z.string().trim().max(160).transform((value) => value || null),
  visionDescription: z.string().trim().max(2000).transform((value) => value || null),
  aboutImageUrl: optionalUrl,
});

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function updateConstructSiteSettingsAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") redirect("/dashboard/site?error=You do not have permission to edit settings.");

  const input = Object.fromEntries(
    Object.keys(settingsSchema.shape).map((key) => [key, formValue(formData, key)]),
  );
  const result = settingsSchema.safeParse(input);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid settings.";
    redirect(`/dashboard/site?error=${encodeURIComponent(message)}`);
  }

  const prisma = getConstructPrisma();
  await prisma.$transaction([
    prisma.siteSettings.update({
      where: { organizationId: context.organizationId },
      data: result.data,
    }),
    prisma.auditLog.create({
      data: {
        organizationId: context.organizationId,
        actorUserId: context.userId,
        module: "site-settings",
        action: "update",
        recordId: context.organizationId,
        title: "Site settings updated",
      },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/site");
  redirect("/dashboard/site?saved=1");
}
