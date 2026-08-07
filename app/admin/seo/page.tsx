import AdminPage from "@/components/admin/layout/AdminPage";
import AdminSection from "@/components/admin/layout/AdminSection";
import EmptyState from "@/components/admin/common/EmptyState";
import SeoPagesTable from "@/components/admin/seo/SeoPagesTable";

import {
  ensureSeoDefaults,
  getSeoPages,
} from "@/lib/actions/seo.actions";

export default async function SeoPage() {
  await ensureSeoDefaults();
  const pages = await getSeoPages();

  return (
    <AdminPage
      title="SEO"
      description="Manage global metadata and per-page SEO configuration."
      action={{
        label: "Global SEO Settings",
        href: "/admin/seo/settings",
      }}
    >
      {pages.length === 0 ? (
        <EmptyState
          title="No SEO Pages Yet"
          description="Seed default SEO pages to get started."
          actionLabel="Global SEO Settings"
          actionHref="/admin/seo/settings"
        />
      ) : (
        <AdminSection
          title="Pages"
          description="Edit metadata for each website page."
        >
          <SeoPagesTable pages={pages} />
        </AdminSection>
      )}
    </AdminPage>
  );
}
