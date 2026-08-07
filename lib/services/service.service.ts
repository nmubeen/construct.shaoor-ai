import { prisma } from "@/lib/prisma";

export const serviceService = {
  async getAll() {
    return prisma.service.findMany({
      orderBy: {
        displayOrder: "asc",
      },
    });
  },

  async getActive() {
    return prisma.service.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });
  },

  async getById(id: number) {
    return prisma.service.findUnique({
      where: {
        id,
      },
    });
  },

  async getBySlug(slug: string) {
    return prisma.service.findUnique({
      where: {
        slug,
      },
    });
  },

  async create(data: {
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    image: string;
    icon: string;
    displayOrder: number;
    isActive: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    canonicalUrl: string | null;
  }) {
    return prisma.service.create({
      data,
    });
  },

  async update(
    id: number,
    data: {
      title: string;
      slug: string;
      shortDescription: string;
      description: string;
      image: string;
      icon: string;
      displayOrder: number;
      isActive: boolean;
      seoTitle: string | null;
      seoDescription: string | null;
      seoKeywords: string | null;
      canonicalUrl: string | null;
    }
  ) {
    return prisma.service.update({
      where: {
        id,
      },
      data,
    });
  },

  async delete(id: number) {
    return prisma.service.delete({
      where: {
        id,
      },
    });
  },

  async exists(slug: string, excludeId?: number) {
    const service = await prisma.service.findFirst({
      where: {
        slug,
        ...(excludeId
          ? {
              NOT: {
                id: excludeId,
              },
            }
          : {}),
      },
    });

    return !!service;
  },

  async count() {
    return prisma.service.count();
  },
};