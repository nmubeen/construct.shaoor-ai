import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";

// The exact shape written into ProgressSnapshot.snapshot at "Publish
// changes" time, and the only source the public page and the
// dashboard's "what the customer currently sees" preview ever read for
// the project summary + milestones — never a live join, so an Editor's
// unapproved edit to the working-copy ProgressProject/ProgressMilestone
// rows can never leak until an Owner/Admin explicitly publishes again
// (same guarantee ProposalSnapshot gives Proposal). Published
// ProgressUpdates are read live and separately — see
// construct-progress-public.service.ts's own comment for why.
//
// Deliberately excludes customerEmail/customerPhone/internalNotes and
// location unless explicitly marked customer-visible — see the product
// spec's "do not show" list for the public page.
export type ProgressSnapshot = {
  revisionNumber: number;
  publishedAt: string;
  title: string;
  customerName: string;
  customerSummary: string;
  lifecycle: "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  currentStage: string | null;
  nextPlannedActivity: string | null;
  location: string | null;
  plannedStartDate: string | null;
  targetCompletionDate: string | null;
  milestones: Array<{
    id: string;
    title: string;
    description: string | null;
    plannedDate: string | null;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    completedDate: string | null;
  }>;
  branding: {
    companyName: string;
    logoUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
    phone: string;
    email: string;
    whatsApp: string | null;
    website: string | null;
  };
};

export async function buildConstructProgressSnapshot(projectId: string, revisionNumber: number): Promise<ProgressSnapshot> {
  const prisma = getConstructPrisma();
  const project = await prisma.progressProject.findUniqueOrThrow({
    where: { id: projectId },
    include: { milestones: { orderBy: { sortOrder: "asc" } } },
  });

  const settings = await prisma.siteSettings.findUnique({ where: { organizationId: project.organizationId } });

  return {
    revisionNumber,
    publishedAt: new Date().toISOString(),
    title: project.title,
    customerName: project.customerName,
    customerSummary: project.customerSummary,
    lifecycle: project.lifecycle,
    currentStage: project.currentStage,
    nextPlannedActivity: project.nextPlannedActivity,
    location: project.locationCustomerVisible ? project.location : null,
    plannedStartDate: project.plannedStartDate ? project.plannedStartDate.toISOString() : null,
    targetCompletionDate: project.targetCompletionDate ? project.targetCompletionDate.toISOString() : null,
    milestones: project.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      plannedDate: m.plannedDate ? m.plannedDate.toISOString() : null,
      status: m.status,
      completedDate: m.completedDate ? m.completedDate.toISOString() : null,
    })),
    branding: {
      companyName: settings?.companyName ?? "",
      logoUrl: settings?.logoUrl ?? null,
      primaryColor: settings?.themePrimaryColor ?? null,
      accentColor: settings?.themeAccentColor ?? null,
      phone: settings?.phone ?? "",
      email: settings?.email ?? "",
      whatsApp: settings?.whatsApp ?? null,
      website: settings?.website ?? null,
    },
  };
}
