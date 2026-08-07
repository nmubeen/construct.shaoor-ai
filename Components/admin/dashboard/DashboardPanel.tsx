import { ReactNode } from "react";

interface DashboardPanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function DashboardPanel({
  title,
  subtitle,
  action,
  children,
}: DashboardPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>

      <div className="p-6">
        {children}
      </div>
    </div>
  );
}