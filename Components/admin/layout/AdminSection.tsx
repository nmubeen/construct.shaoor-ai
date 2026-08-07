import { ReactNode } from "react";
import Card from "@/components/admin/primitives/Card";

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
    <Card>
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="divide-y divide-slate-100 px-6">
        {children}
      </div>
    </Card>
  );
}