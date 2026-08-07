import { notFound } from "next/navigation";

import AdminPage from "@/components/admin/layout/AdminPage";
import SeoForm from "@/components/admin/seo/SeoForm";

import {
  ensureSeoDefaults,
  getSeoPage,
  getSeoSettings,
} from "@/lib/actions/seo.actions";

interface PageProps {
  params: Promise<{
    pageKey: string;
  }>;
}

export default async function SeoPageEditor({
  params,
}: PageProps) {
  const { pageKey } = await params;

  await ensureSeoDefaults();

  const [page, settings] = await Promise.all([
    getSeoPage(pageKey),
    getSeoSettings(),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <AdminPage
      title={`SEO: ${page.pageName}`}
      description="Update page-level SEO metadata and previews."
    >
      <SeoForm
        mode="page"
        page={page}
        siteUrl={settings.siteUrl}
        siteName={settings.siteName}
      />
    </AdminPage>
  );
}
