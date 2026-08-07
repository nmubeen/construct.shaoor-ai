import AdminPage from "@/components/admin/layout/AdminPage";
import SeoForm from "@/components/admin/seo/SeoForm";

import {
  ensureSeoDefaults,
  getSeoSettings,
} from "@/lib/actions/seo.actions";

export default async function SeoSettingsPage() {
  await ensureSeoDefaults();
  const settings = await getSeoSettings();

  return (
    <AdminPage
      title="SEO Settings"
      description="Manage global SEO defaults used across the website."
    >
      <SeoForm mode="settings" settings={settings} />
    </AdminPage>
  );
}
