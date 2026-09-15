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

      {/* Standardized admin page-header band: PrimaryBackgroundColor
          (--gradient-primary-bg), same as the tenant home page and the
          login screens — re-pointing the variable retints all of them. */}
      <div className="relative overflow-hidden rounded-md bg-(image:--gradient-primary-bg) px-6 py-8 text-white">

        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>
            {/* Explicit text-white: .construct-admin-surface's global
                h1/h2/h3 rule (globals.css) targets <h1> directly and beats
                the inherited white from this header. */}
            <h1 className="text-3xl font-bold text-white">
              {title}
            </h1>

            {description && (
              <p className="mt-2 text-slate-200">
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
      </div>

      <div className="space-y-8">
        {children}
      </div>

    </div>
  );
}