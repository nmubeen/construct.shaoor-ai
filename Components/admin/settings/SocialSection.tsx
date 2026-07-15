import { Settings } from "@prisma/client";

interface Props {
  settings: Settings;
}

export default function SocialSection({ settings }: Props) {
  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold">
        Social Media
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <input
          name="facebook"
          placeholder="Facebook"
          defaultValue={settings.facebook ?? ""}
          className="rounded-lg border px-4 py-3"
        />

        <input
          name="instagram"
          placeholder="Instagram"
          defaultValue={settings.instagram ?? ""}
          className="rounded-lg border px-4 py-3"
        />

        <input
          name="linkedin"
          placeholder="LinkedIn"
          defaultValue={settings.linkedin ?? ""}
          className="rounded-lg border px-4 py-3"
        />

        <input
          name="twitter"
          placeholder="X / Twitter"
          defaultValue={settings.twitter ?? ""}
          className="rounded-lg border px-4 py-3"
        />

        <input
          name="youtube"
          placeholder="YouTube"
          defaultValue={settings.youtube ?? ""}
          className="rounded-lg border px-4 py-3 md:col-span-2"
        />
      </div>
    </section>
  );
}