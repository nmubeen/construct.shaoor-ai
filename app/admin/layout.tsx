import { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { currentUser } from "@/lib/auth/auth";
import { getSiteSettings } from "@/lib/settings";
import { getTenantContext, tenantPath } from "@/lib/tenant";
import { verifyPassword } from "@/lib/auth/password";

interface Props {
  children: ReactNode;
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: Props) {
  const [user, settings, tenant] = await Promise.all([
    currentUser(),
    getSiteSettings(),
    getTenantContext(),
  ]);

  if (!user) {
    redirect(await tenantPath("/login"));
  }

  if (!tenant.isSuperAdmin && await verifyPassword("Password", user.passwordHash)) {
    redirect(await tenantPath("/change-password"));
  }

  return (
    <div className="construct-app-surface construct-admin-surface flex min-h-screen">
      <AdminSidebar companyName={tenant.isSuperAdmin ? "Shaoor Construct" : settings.companyName} prefix={tenant.urlPrefix} superAdmin={tenant.isSuperAdmin} />

      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
        {children}
      </main>
    </div>
  );
}
