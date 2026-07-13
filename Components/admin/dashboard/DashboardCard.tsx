import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
}

export default function DashboardCard({
  title,
  value,
  icon,
  color,
}: DashboardCardProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            {value}
          </h2>

        </div>

        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl text-white"
          style={{
            backgroundColor: color,
          }}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}