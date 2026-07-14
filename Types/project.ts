import { Prisma } from "@prisma/client";

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    gallery: true;
    highlights: true;
  };
}>;

export type ProjectSummary = Prisma.ProjectGetPayload<{}>;