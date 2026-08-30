import "server-only";

import { cache } from "react";
import { getConstructPrisma } from "@/lib/construct-prisma";

export const demoCmsModules = [
  "overview",
  "website",
  "projects",
  "services",
  "media",
  "content",
  "team",
  "enquiries",
  "seo",
  "settings",
] as const;

export type DemoCmsModule = (typeof demoCmsModules)[number];

export function isDemoCmsModule(value: string): value is DemoCmsModule {
  return demoCmsModules.includes(value as DemoCmsModule);
}

export const getDemoCmsData = cache(async () =>
  getConstructPrisma().organization.findUnique({
    where: { slug: "demo" },
    include: {
      settings: true,
      publication: true,
      domains: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      projects: { orderBy: { updatedAt: "desc" } },
      services: { orderBy: [{ displayOrder: "asc" }, { title: "asc" }] },
      media: { orderBy: { createdAt: "desc" } },
      teamMembers: { orderBy: [{ displayOrder: "asc" }, { name: "asc" }] },
      clients: { orderBy: [{ displayOrder: "asc" }, { name: "asc" }] },
      testimonials: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      },
      faqs: { orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }] },
      messages: {
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      seoSettings: true,
      seoPages: { orderBy: { pageName: "asc" } },
      navigationItems: { orderBy: { displayOrder: "asc" } },
    },
  }),
);
