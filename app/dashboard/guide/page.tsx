import { SetupGuideSteps } from "@/components/dashboard/guide/SetupGuideSteps";
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
            <h1 className="text-3xl font-bold tracking-tight text-white">Setup guide</h1>
            <p className="mt-2 text-sm text-slate-200">Work through these steps in order to turn this workspace into a published website. Each item updates automatically as you complete it — nothing here to check off by hand.</p>
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
    </div>
  );
}
