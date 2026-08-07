import { cache } from "react";

import { prisma } from "@/lib/prisma";

export const getSiteSettings = cache(async () => {
  let settings = await prisma.settings.findFirst();

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        companyName: "Company Name",
        tagline: "Building Excellence",
        description: "",

        logo: "",
        favicon: "",

        phone: "",
        email: "",
        website: "",

        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",

        facebook: "",
        instagram: "",
        linkedin: "",
        twitter: "",
        youtube: "",

        heroTitle: "",
        heroSubtitle: "",
        heroImage: "",

        ctaTitle: "",
        ctaSubtitle: "",
        ctaButtonText: "Contact Us",
        ctaButtonLink: "/contact",

        projectsCompleted: 0,
        clientsServed: 0,
        yearsExperience: 0,
        employees: 0,

        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",

        whatsApp: "",
        googleMapsUrl: "",
      },
    });
  }

  return settings;
});