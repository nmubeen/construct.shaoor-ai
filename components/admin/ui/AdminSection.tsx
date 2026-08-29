import { ReactNode } from "react";
import AdminCard from "./AdminCard";

interface AdminSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function AdminSection({
  title,
  description,
  children,
}: AdminSectionProps) {
  return (
    <AdminCard>
      <div className="border-b border-slate-200 px-8 py-6">
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="divide-y divide-slate-100 px-8 py-4">
        {children}
      </div>
    </AdminCard>
  );
}