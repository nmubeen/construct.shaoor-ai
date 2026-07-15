interface Props {
  settings: any;
}

export default function CompanySection({
  settings,
}: Props) {
  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold">
        Company Information
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Company Name
          </label>

          <input
            name="companyName"
            defaultValue={settings.companyName}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Tagline
          </label>

          <input
            name="tagline"
            defaultValue={settings.tagline}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">
            Description
          </label>

          <textarea
            rows={4}
            name="description"
            defaultValue={settings.description}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>
      </div>
    </section>
  );
}