import Link from "next/link";
import { IconType } from "react-icons";

interface DashboardStatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: IconType;
  href?: string;
  color?: string;
}

export default function DashboardStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  color = "bg-[#0E4A7B]",
}: DashboardStatCardProps) {
  const card = (
    <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-2 text-sm text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-xl ${color}`}
        >
          <Icon
            className="text-white"
            size={26}
          />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        {card}
      </Link>
    );
  }

  return card;
}