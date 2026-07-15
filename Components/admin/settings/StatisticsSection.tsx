import { Settings } from "@prisma/client";

interface Props {
  settings: Settings;
}

export default function StatisticsSection({ settings }: Props) {
  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold">
        Company Statistics
      </h2>

      <div className="grid gap-6 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Projects
          </label>

          <input
            type="number"
            name="projectsCompleted"
            defaultValue={settings.projectsCompleted}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Clients
          </label>

          <input
            type="number"
            name="clientsServed"
            defaultValue={settings.clientsServed}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Years
          </label>

          <input
            type="number"
            name="yearsExperience"
            defaultValue={settings.yearsExperience}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Employees
          </label>

          <input
            type="number"
            name="employees"
            defaultValue={settings.employees}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>
      </div>
    </section>
  );
}