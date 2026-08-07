"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { logActivity } from "@/lib/actions/audit.actions";

export async function getSettings() {
  return getSiteSettings();
}

export async function updateSettings(formData: FormData) {
  try {
    const settings = await getSettings();

    const updatedSettings = await prisma.settings.update({
      where: {
        id: settings.id,
      },
      data: {
        companyName: String(formData.get("companyName") ?? ""),
        tagline: String(formData.get("tagline") ?? ""),
        description: String(formData.get("description") ?? ""),

        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        website: String(formData.get("website") ?? ""),
        addressLine1: String(formData.get("addressLine1") ?? ""),
        addressLine2: String(formData.get("addressLine2") ?? ""),
        city: String(formData.get("city") ?? ""),
        state: String(formData.get("state") ?? ""),
        country: String(formData.get("country") ?? ""),
        postalCode: String(formData.get("postalCode") ?? ""),

        facebook: String(formData.get("facebook") ?? ""),
        instagram: String(formData.get("instagram") ?? ""),
        linkedin: String(formData.get("linkedin") ?? ""),
        twitter: String(formData.get("twitter") ?? ""),
        youtube: String(formData.get("youtube") ?? ""),

        heroTitle: String(formData.get("heroTitle") ?? ""),
        heroSubtitle: String(formData.get("heroSubtitle") ?? ""),
        heroImage: String(formData.get("heroImage") ?? ""),

        ctaTitle: String(formData.get("ctaTitle") ?? ""),
        ctaSubtitle: String(formData.get("ctaSubtitle") ?? ""),
        ctaButtonText: String(formData.get("ctaButtonText") ?? ""),
        ctaButtonLink: String(formData.get("ctaButtonLink") ?? ""),

        projectsCompleted: Number(formData.get("projectsCompleted") ?? 0),
        clientsServed: Number(formData.get("clientsServed") ?? 0),
        yearsExperience: Number(formData.get("yearsExperience") ?? 0),
        employees: Number(formData.get("employees") ?? 0),

        seoTitle: String(formData.get("seoTitle") ?? ""),
        seoDescription: String(formData.get("seoDescription") ?? ""),
        seoKeywords: String(formData.get("seoKeywords") ?? ""),

        whatsApp: String(formData.get("whatsApp") ?? ""),
        googleMapsUrl: String(formData.get("googleMapsUrl") ?? ""),
        favicon: String(formData.get("favicon") ?? ""),
      },
    });

    await logActivity({
      module: "Settings",
      action: "UPDATE",
      recordId: String(updatedSettings.id),
      title: "Updated Site Settings",
      details: `Company: ${updatedSettings.companyName}`,
    });

    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/contact");
    revalidatePath("/admin/settings");
  } catch (error) {
    console.error(error);
    throw new Error("Unable to save settings.");
  }
}