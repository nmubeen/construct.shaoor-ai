import type { Metadata } from "next";

import { ConstructDashboardSidebar } from "@/components/dashboard/ConstructDashboardSidebar";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";

export const metadata: Metadata = { title: "Dashboard | Shaoor Construct", robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await requireActiveConstructContext();
  return <div className="construct-app-surface construct-admin-surface min-h-screen"><ConstructDashboardSidebar organizationName={context.organization.name} role={context.role} organizationStatus={context.organization.status} /><main className="dashboard-content min-w-0 lg:ml-72">{children}</main></div>;
}
