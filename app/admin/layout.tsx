import { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { currentUser } from "@/lib/auth/auth";
import { getSiteSettings } from "@/lib/settings";

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
  const [user, settings] = await Promise.all([
    currentUser(),
    getSiteSettings(),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar companyName={settings.companyName} />

      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
