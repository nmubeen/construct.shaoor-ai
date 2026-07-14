import { ReactNode } from "react";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireUser } from "@/lib/auth/auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />

      <main className="flex-1 bg-slate-100 p-8">
        {children}
      </main>
    </div>
  );
}