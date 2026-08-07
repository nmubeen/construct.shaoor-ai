"use client";

import { cn } from "@/lib/utils";

interface Props {
  status: string;
}

export default function StatusBadge({
  status,
}: Props) {

  const styles = {
    Active:
      "bg-green-100 text-green-700",

    Inactive:
      "bg-gray-100 text-gray-700",

    Draft:
      "bg-yellow-100 text-yellow-700",

    Featured:
      "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        styles[status as keyof typeof styles] ??
          "bg-slate-100 text-slate-700"
      )}
    >
      {status}
    </span>
  );
}