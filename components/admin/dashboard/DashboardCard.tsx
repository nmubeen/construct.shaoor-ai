import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;

  href?: string;
  actionLabel?: string;

  className?: string;
  bodyClassName?: string;
}

export default function DashboardCard({
  title,
  subtitle,
  children,

  href,
  actionLabel = "View All",

  className = "",
  bodyClassName = "p-6",
}: DashboardCardProps) {
  return (
    <div
      className={`rounded-xl border bg-white shadow-sm ${className}`}
    >
      <header className="flex items-center justify-between border-b px-6 py-4">

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

        {href && (
          <Link
            href={href}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            {actionLabel}

            <FaArrowRight className="text-xs" />
          </Link>
        )}

      </header>

      <div className={bodyClassName}>

        {children}

      </div>

    </div>
  );
}
