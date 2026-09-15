"use client";

// Drives the 15-step default-services seed one item at a time (see
// lib/services/construct-service-seed.service.ts's seedConstructDefaultServiceAtIndex)
// so the slow part — an image render + Supabase Storage upload + DB write
// per service — has somewhere to show progress, instead of one plain
// <form action> request that left the button looking hung for the whole
// ~15-30s it used to take with no feedback at all.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Hourglass, Sparkles, XCircle } from "lucide-react";

import { seedConstructDefaultServiceStepAction, startConstructServiceSeedAction } from "@/lib/actions/construct-service.actions";

type Phase = "idle" | "running" | "done" | "error";

export function SeedServicesButton() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentTitle, setCurrentTitle] = useState("");
  const [error, setError] = useState("");

  async function runSteps(fromIndex: number, stepsTotal: number) {
    setPhase("running");
    setError("");

    for (let index = fromIndex; index < stepsTotal; index += 1) {
      setCurrentTitle("");
      const result = await seedConstructDefaultServiceStepAction(index);
      if (!result.ok) {
        setPhase("error");
        setError(result.error);
        return;
      }
      setCurrentTitle(result.title);
      setCompleted(index + 1);
    }

    setPhase("done");
    // The service list itself is rendered server-side on this page —
    // refresh so it reflects everything just created.
    router.refresh();
  }

  async function begin() {
    setCompleted(0);
    setPhase("running");
    setError("");

    const start = await startConstructServiceSeedAction();
    if (!start.started) {
      setPhase("error");
      setError("Services already exist — seeding is only available for an empty list.");
      return;
    }
    setTotal(start.total);
    await runSteps(0, start.total);
  }

  // Resumes past whatever step failed, rather than calling begin() again —
  // by the time a step has failed, `completed` items already exist, so a
  // fresh startConstructServiceSeedAction() call would (correctly) refuse
  // as "not empty". The per-item idempotency-by-slug check in
  // seedConstructDefaultServiceAtIndex makes this safe even if `completed`
  // is stale for some reason.
  async function retry() {
    await runSteps(completed, total);
  }

  if (phase === "idle") {
    return (
      <button
        type="button"
        onClick={() => void begin()}
        className="inline-flex items-center gap-2 rounded-md border border-[#7D9D76] bg-white px-4 py-2.5 text-sm font-semibold text-(--color-primary-text) hover:bg-[#eef3ec]"
      >
        <Sparkles className="size-4" />
        Seed default services
      </button>
    );
  }

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-sm space-y-3 text-left">
      <div className="flex items-center gap-2 text-sm font-semibold text-(--color-primary-text)">
        {phase === "running" && <Hourglass className="size-4 animate-pulse" />}
        {phase === "done" && <CheckCircle2 className="size-4 text-emerald-600" />}
        {phase === "error" && <XCircle className="size-4 text-red-600" />}
        <span>
          {phase === "running" && (currentTitle ? `Adding "${currentTitle}"…` : "Starting…")}
          {phase === "done" && `Added ${total} default services.`}
          {phase === "error" && "Seeding stopped."}
        </span>
      </div>

      {phase !== "error" && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full bg-(--color-primary-text) transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      {phase !== "error" && (
        <p className="text-center text-xs text-slate-500">
          {completed} of {total} services{phase === "running" ? "…" : " added"}
        </p>
      )}

      {phase === "error" && (
        <div className="space-y-3">
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
          {completed > 0 && (
            <p className="text-xs text-slate-500">
              {completed} of {total} services were created before this happened — they&apos;ve been kept, not rolled back.
            </p>
          )}
          <button
            type="button"
            onClick={() => void (total > 0 ? retry() : begin())}
            className="w-full rounded-md border border-[#7D9D76] px-4 py-2.5 text-sm font-semibold text-(--color-primary-text) hover:bg-[#eef3ec]"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
