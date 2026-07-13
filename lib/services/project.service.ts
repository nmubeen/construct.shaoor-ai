import { prisma } from "@/lib/prisma";

export const projectService = {
  async getAll() {
    return prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async getById(id: number) {
    return prisma.project.findUnique({
      where: {
        id,
      },
    });
  },
};