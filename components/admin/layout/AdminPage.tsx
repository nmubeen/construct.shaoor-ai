import React from "react";
import Link from "next/link";

import Button from "@/components/admin/primitives/Button";

interface AdminPageAction {
  label: string;
  href: string;
}

interface AdminPageProps {
  title: string;
  description?: string;
  action?: React.ReactNode | AdminPageAction;
  children: React.ReactNode;
}

function isActionConfig(
  action: React.ReactNode | AdminPageAction
): action is AdminPageAction {
  return (
    typeof action === "object" &&
    action !== null &&
    "label" in action &&
    "href" in action
  );
}

export default function AdminPage({
  title,
  description,
  action,
  children,
}: AdminPageProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">

      <div className="flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-center">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {title}
          </h1>

          {description && (
            <p className="mt-2 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0">
            {isActionConfig(action) ? (
              <Button asChild>
                <Link href={action.href}>
                  {action.label}
                </Link>
              </Button>
            ) : (
              action
            )}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {children}
      </div>

    </div>
  );
}