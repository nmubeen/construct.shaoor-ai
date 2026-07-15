import { ReactNode } from "react";
import { redirect } from "next/navigation";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { currentUser } from "@/lib/auth/auth";

interface Props {
  children: ReactNode;
}

export default async function AdminLayout({
  children,
}: Props) {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}