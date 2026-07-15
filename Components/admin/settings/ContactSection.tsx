interface Props {
  settings: any;
}

export default function ContactSection({
  settings,
}: Props) {
  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold">
        Contact Information
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <input
          name="phone"
          placeholder="Phone"
          defaultValue={settings.phone}
          className="rounded-lg border px-4 py-3"
        />

        <input
          name="email"
          placeholder="Email"
          defaultValue={settings.email}
          className="rounded-lg border px-4 py-3"
        />

        <input
          name="website"
          placeholder="Website"
          defaultValue={settings.website}
          className="rounded-lg border px-4 py-3"
        />

        <input
          name="whatsApp"
          placeholder="WhatsApp"
          defaultValue={settings.whatsApp}
          className="rounded-lg border px-4 py-3"
        />

        <textarea
          rows={3}
          name="address"
          placeholder="Address"
          defaultValue={settings.address}
          className="md:col-span-2 rounded-lg border px-4 py-3"
        />

        <input
          name="googleMapsUrl"
          placeholder="Google Maps URL"
          defaultValue={settings.googleMapsUrl}
          className="md:col-span-2 rounded-lg border px-4 py-3"
        />
      </div>
    </section>
  );
}