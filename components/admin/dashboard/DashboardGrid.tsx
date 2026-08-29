import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

export default function DashboardGrid({
  children,
  className,
}: DashboardGridProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        "grid-cols-1",
        "md:grid-cols-2",
        "xl:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}