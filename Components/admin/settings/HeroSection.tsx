import { Settings } from "@prisma/client";
import ImageUpload from "@/components/admin/common/ImageUpload";
interface Props {
  settings: Settings;
}

export default function HeroSection({ settings }: Props) {
  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold">
        Homepage Hero
      </h2>

      <div className="grid gap-6">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Hero Title
          </label>

          <input
            name="heroTitle"
            defaultValue={settings.heroTitle}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Hero Subtitle
          </label>

          <textarea
            rows={3}
            name="heroSubtitle"
            defaultValue={settings.heroSubtitle}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

<ImageUpload
  label="Hero Image"
  name="heroImage"
  defaultValue={settings.heroImage ?? ""}
/>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              CTA Title
            </label>

            <input
              name="ctaTitle"
              defaultValue={settings.ctaTitle}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              CTA Subtitle
            </label>

            <input
              name="ctaSubtitle"
              defaultValue={settings.ctaSubtitle}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              CTA Button Text
            </label>

            <input
              name="ctaButtonText"
              defaultValue={settings.ctaButtonText}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              CTA Button Link
            </label>

            <input
              name="ctaButtonLink"
              defaultValue={settings.ctaButtonLink}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>
        </div>
      </div>
    </section>
  );
}