import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SEO_PAGE_DEFAULTS = [
  { pageKey: "home", pageName: "Home" },
  { pageKey: "about", pageName: "About" },
  { pageKey: "services", pageName: "Services" },
  { pageKey: "projects", pageName: "Projects" },
  { pageKey: "team", pageName: "Team" },
  { pageKey: "clients", pageName: "Clients" },
  { pageKey: "testimonials", pageName: "Testimonials" },
  { pageKey: "faq", pageName: "FAQ" },
  { pageKey: "contact", pageName: "Contact" },
] as const;

function pageHref(pageKey: string) {
  return pageKey === "home" ? "/" : `/${pageKey}`;
}

async function main() {
  const passwordHash = await bcrypt.hash(
    "Admin@123",
    12
  );

  await prisma.company.upsert({
    where: { id: 0 },
    update: {},
    create: { id: 0, code: "Shaoor-Construct" },
  });

  const admin = await prisma.user.upsert({
    where: {
      companyId_email: { companyId: 0, email: "superadmin" },
    },
    update: {},
    create: {
      name: "Administrator",

      email: "superadmin",

      passwordHash,

      role: "ADMIN",
      companyId: 0,
    },
  });

  await prisma.company.update({ where: { id: 0 }, data: { adminUserId: admin.id } });

  console.log("✅ Admin user created");

  const appSettings = await prisma.settings.upsert({
    where: {
      id: 1,
    },
    update: {},
    create: {
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
      companyId: 0,
    },
  });

  const existingSettings = await prisma.seoSettings.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  const seoSettings =
    existingSettings ??
    (await prisma.seoSettings.create({
      data: {
        siteName: appSettings.companyName,
        defaultTitle: appSettings.seoTitle || appSettings.companyName,
        defaultDescription:
          "Professional construction company delivering quality projects.",
        siteUrl: appSettings.website || "https://example.com",
        companyId: 0,
      },
    }));

  await Promise.all(
    SEO_PAGE_DEFAULTS.map((item) =>
      prisma.seoPage.upsert({
        where: {
          companyId_pageKey: { companyId: 0, pageKey: item.pageKey },
        },
        update: {},
        create: {
          pageKey: item.pageKey,
          pageName: item.pageName,
          title: `${item.pageName} | ${seoSettings.siteName}`,
          description: seoSettings.defaultDescription,
          keywords: seoSettings.defaultKeywords,
          canonicalUrl: `${seoSettings.siteUrl}${pageHref(item.pageKey)}`,
          ogTitle: `${item.pageName} | ${seoSettings.siteName}`,
          ogDescription: seoSettings.defaultDescription,
          ogImage: seoSettings.defaultOgImage,
          robotsIndex: seoSettings.robotsIndex,
          robotsFollow: seoSettings.robotsFollow,
          companyId: 0,
        },
      })
    )
  );

  console.log("✅ SEO defaults ensured");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
