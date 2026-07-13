import { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  actions?: ReactNode;
}

export default function PageTitle({
  title,
  actions,
}: PageTitleProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <h1 className="text-3xl font-bold">{title}</h1>

      {actions}
    </div>
  );
}