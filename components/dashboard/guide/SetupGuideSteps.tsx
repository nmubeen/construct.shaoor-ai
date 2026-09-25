"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, CircleAlert, Circle } from "lucide-react";

import type { SetupGuideStep } from "@/lib/services/construct-setup-guide.service";

function stepComplete(step: SetupGuideStep) {
  return step.items.every((item) => item.met);
}

function ItemRow({ item }: { item: SetupGuideStep["items"][number] }) {
  const Icon = item.met ? CheckCircle2 : item.required ? CircleAlert : Circle;
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className={`flex items-center gap-2 text-sm ${item.met ? "text-slate-600 line-through decoration-slate-300" : "text-slate-800"}`}>
        <Icon className={`size-4 shrink-0 ${item.met ? "text-(--color-secondary-text-icon)" : item.required ? "text-amber-500" : "text-slate-300"}`} />
        {item.label}
      </span>
      {!item.met && <Link href={item.href} className="shrink-0 text-xs font-semibold text-(--color-secondary-text-icon) hover:underline">Go &rarr;</Link>}
    </li>
  );
}

// Accordion: starts with the first not-yet-complete step open (so a
// returning owner lands exactly where they left off) and every other
// step collapsed, rather than a wall of expanded checklists. All state
// is derived live from props on every render — no persisted "dismissed"
// state, so the guide always reflects the workspace's actual current
// state, self-corrects if something gets un-done, and never needs a
// migration to add.
export function SetupGuideSteps({ steps }: { steps: SetupGuideStep[] }) {
  const firstIncomplete = steps.findIndex((step) => !stepComplete(step));
  const [openKey, setOpenKey] = useState<string | null>(steps[firstIncomplete >= 0 ? firstIncomplete : 0]?.key ?? null);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const complete = stepComplete(step);
        const isOpen = openKey === step.key;
        return (
          <section key={step.key} className={`overflow-hidden rounded-lg border bg-white shadow-sm ${complete ? "border-slate-200" : "border-[#7D9D76]/40"}`}>
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : step.key)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${complete ? "bg-[#eef3ec] text-(--color-secondary-text-icon)" : "bg-slate-100 text-slate-500"}`}>
                  {complete ? <CheckCircle2 className="size-5" /> : index + 1}
                </span>
                <div>
                  <h2 className="font-bold text-(--color-primary-text)">{step.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{step.items.filter((item) => item.met).length} of {step.items.length} done</p>
                </div>
              </div>
              <ChevronDown className={`size-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-4 pb-4">
                <p className="pt-3 text-sm text-slate-600">{step.description}</p>
                <ul className="mt-1 divide-y divide-slate-100">
                  {step.items.map((item) => <ItemRow key={item.label} item={item} />)}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
