import { SetupGuideSteps } from "@/components/dashboard/guide/SetupGuideSteps";
import { UsageGuideTopics } from "@/components/dashboard/guide/UsageGuideTopics";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructSetupGuideSteps } from "@/lib/services/construct-setup-guide.service";

export default async function SetupGuidePage() {
  const context = await requireActiveConstructContext();
  const steps = await getConstructSetupGuideSteps(context.organizationId);

  const allItems = steps.flatMap((step) => step.items);
  const doneCount = allItems.filter((item) => item.met).length;
  const percent = allItems.length > 0 ? Math.round((doneCount / allItems.length) * 100) : 0;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="rounded-md bg-(image:--gradient-primary-bg) p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-secondary-text-icon)">Getting started</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Setup and Usage Guide</h1>
            <p className="mt-2 text-sm text-slate-200">Work through the setup steps in order to turn this workspace into a published website — each item updates automatically as you complete it. Below that, a reference guide for the day-to-day workflows you&apos;ll come back to afterwards.</p>
          </div>
          <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase text-white">{doneCount} of {allItems.length} done</span>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-(image:--gradient-secondary-bg) transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </header>

      <div className="py-6">
        <SetupGuideSteps steps={steps} />
      </div>

      <div className="pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-secondary-text-icon)">Ongoing usage guide</p>
        <h2 className="mt-2 text-xl font-bold text-(--color-primary-text)">Day-to-day workflows</h2>
        <p className="mt-1 text-sm text-slate-600">Not a checklist — these are things you&apos;ll come back to regularly as you run the workspace. Select a topic to expand it.</p>
        <div className="mt-4">
          <UsageGuideTopics />
        </div>
      </div>
    </div>
  );
}
