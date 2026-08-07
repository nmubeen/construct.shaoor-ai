"use client";

import Link from "next/link";
import { ReactNode } from "react";
import {
  FaArrowRight,
} from "react-icons/fa6";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  href?: string;
  subtitle?: string;
  color?:
    | "blue"
    | "green"
    | "amber"
    | "red"
    | "slate";
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-600",
  },
};

export default function StatCard({
  title,
  value,
  icon,
  href,
  subtitle,
  color = "blue",
}: StatCardProps) {
  const card = (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md">

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
          className={`flex h-14 w-14 items-center justify-center rounded-xl ${
            colorMap[color].bg
          } ${colorMap[color].text}`}
        >
          {icon}
        </div>

      </div>

      {href && (
        <div className="mt-6 flex items-center justify-end text-sm font-medium text-blue-600">
          View
          <FaArrowRight className="ml-2 text-xs" />
        </div>
      )}

    </div>
  );

  if (!href) {
    return card;
  }

  return (
    <Link href={href}>
      {card}
    </Link>
  );
}