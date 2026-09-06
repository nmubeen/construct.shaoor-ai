import Link from "next/link";
import { CheckCircle2, CircleAlert, ListChecks } from "lucide-react";
import type { PublishChecklistItem } from "@/lib/services/construct-publish-checklist.service";

export function PublishChecklist({
  items,
  isPublished,
}: {
  items: PublishChecklistItem[];
  isPublished: boolean;
}) {
  const required = items.filter((item) => item.required);
  const requiredMet = required.filter((item) => item.met).length;
  const missingRequired = required.filter((item) => !item.met);

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ListChecks className="size-4 text-[#7D9D76]" />
        <p className="text-sm font-bold">
          Publish checklist — {requiredMet} of {required.length} required items ready
        </p>
      </div>

      {isPublished && missingRequired.length > 0 && (
        <p className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          This site is live but still missing {missingRequired.length} required item
          {missingRequired.length > 1 ? "s" : ""} — visitors will see empty contact links or an empty page for
          those.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              {item.met ? (
                <CheckCircle2 className="size-4 shrink-0 text-[#7D9D76]" />
              ) : (
                <CircleAlert className={`size-4 shrink-0 ${item.required ? "text-amber-600" : "text-slate-400"}`} />
              )}
              <span className={item.met ? "text-slate-700" : "font-semibold text-slate-900"}>{item.label}</span>
              {!item.required && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Recommended
                </span>
              )}
            </span>
            {!item.met && (
              <Link href={item.href} className="shrink-0 text-xs font-semibold text-[#7D9D76] hover:underline">
                Fix this
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
