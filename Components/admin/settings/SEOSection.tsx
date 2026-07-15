import { Settings } from "@prisma/client";

interface Props {
  settings: Settings;
}

export default function SEOSection({ settings }: Props) {
  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold">
        Default SEO
      </h2>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">
            SEO Title
          </label>

          <input
            name="seoTitle"
            defaultValue={settings.seoTitle}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            SEO Description
          </label>

          <textarea
            rows={4}
            name="seoDescription"
            defaultValue={settings.seoDescription}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            SEO Keywords
          </label>

          <textarea
            rows={3}
            name="seoKeywords"
            defaultValue={settings.seoKeywords}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>
      </div>
    </section>
  );
}