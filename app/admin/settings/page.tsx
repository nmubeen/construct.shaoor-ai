import { getSettings } from "@/lib/actions/settings.actions";
import SettingsForm from "@/components/admin/settings/SettingsForm";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Website Settings
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your company information, homepage content,
          contact details and SEO settings.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}