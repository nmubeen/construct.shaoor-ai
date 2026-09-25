import type { Metadata } from "next";

import { ConstructDashboardSidebar } from "@/components/dashboard/ConstructDashboardSidebar";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";

export const metadata: Metadata = { title: "Dashboard | Shaoor-AI Construct", robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await requireActiveConstructContext();
  // Cheap enough to run on every dashboard request (a single indexed
  // count) — this is the "visible overdue indicator" the follow-ups
  // spec calls for; it's naturally live since nothing here is cached
  // beyond the request itself.
  const overdueFollowUps = await getConstructPrisma().followUp.count({ where: { organizationId: context.organizationId, status: "OPEN", dueAt: { lt: new Date() } } });
  return <div className="construct-app-surface construct-admin-surface min-h-screen"><ConstructDashboardSidebar organizationName={context.organization.name} role={context.role} organizationStatus={context.organization.status} overdueFollowUps={overdueFollowUps} /><main className="dashboard-content min-w-0 lg:ml-72">{children}</main></div>;
}
