import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";

export type PublishChecklistItem = {
  label: string;
  met: boolean;
  required: boolean;
  href: string;
};

// Nothing here actually blocks a publish anymore (see
// ensureConstructSiteSettingsDefaults — a bare-minimum org no longer
// crashes the live site), so this is advisory rather than a gate: it
// tells an owner what an unedited site would show a real visitor before
// they publish it. "Required" items are things that render as visibly
// broken (an empty tel:/mailto: link, an "Our services" page with
// nothing on it); "recommended" items are things that just look generic
// (the default stock hero photo, the fallback initial-letter logo).
export async function getConstructPublishChecklist(organizationId: string): Promise<PublishChecklistItem[]> {
  const prisma = getConstructPrisma();
  const [settings, projects, services, teamMembers] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { organizationId } }),
    prisma.project.count({ where: { organizationId } }),
    prisma.service.count({ where: { organizationId } }),
    prisma.teamMember.count({ where: { organizationId, isActive: true } }),
  ]);

  const filled = (value: string | null | undefined) => Boolean(value && value.trim().length > 0);

  return [
    { label: "Contact email", met: filled(settings?.email), required: true, href: "/dashboard/site" },
    { label: "Contact phone", met: filled(settings?.phone), required: true, href: "/dashboard/site" },
    { label: "Address (city and country)", met: filled(settings?.city) && filled(settings?.country), required: true, href: "/dashboard/site" },
    { label: "At least one service", met: services > 0, required: true, href: "/dashboard/services" },
    { label: "Logo uploaded", met: filled(settings?.logoUrl), required: false, href: "/dashboard/site" },
    { label: "Custom hero image (otherwise a stock photo shows)", met: filled(settings?.heroImageUrl), required: false, href: "/dashboard/site" },
    { label: "At least one project", met: projects > 0, required: false, href: "/dashboard/projects" },
    { label: "At least one team member", met: teamMembers > 0, required: false, href: "/dashboard/team" },
  ];
}
