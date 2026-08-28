import { PrismaClient } from "@prisma/client";
import { getTenantContext } from "@/lib/tenant";

const globalForPrisma = global as unknown as {
  rawPrisma: PrismaClient | undefined;
};

export const rawPrisma =
  globalForPrisma.rawPrisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.rawPrisma = rawPrisma;
}

const tenantModels = new Set([
  "Project", "Highlight", "ProjectGallery", "Media", "Gallery", "GalleryItem",
  "Settings", "Service", "TeamMember", "Client", "Testimonial", "FAQ", "Message",
  "SeoSettings", "SeoPage", "AuditLog",
]);

export const prisma = rawPrisma.$extends({
  name: "tenant-isolation",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!tenantModels.has(model)) return query(args);

        const { companyId } = await getTenantContext();
        const input = args as Record<string, any>;

        if (operation === "create") {
          input.data = { ...input.data, companyId };
        } else if (operation === "createMany" || operation === "createManyAndReturn") {
          const rows = Array.isArray(input.data) ? input.data : [input.data];
          input.data = rows.map((row) => ({ ...row, companyId }));
        } else if (operation === "upsert") {
          input.where = { ...input.where, companyId };
          input.create = { ...input.create, companyId };
        } else {
          input.where = { ...input.where, companyId };
        }

        return query(input);
      },
    },
  },
});
