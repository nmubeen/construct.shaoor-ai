import { getSiteSettings } from "@/lib/settings";

import AdminPage from "@/components/admin/layout/AdminPage";

import SettingsForm from "@/components/admin/settings/sections/SettingsForm";

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <AdminPage
      title="Website Settings"
      description="Manage company information and website configuration."
    >
      <SettingsForm settings={settings} />
    </AdminPage>
  );
}