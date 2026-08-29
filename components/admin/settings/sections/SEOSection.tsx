import { Settings } from "@prisma/client";

import TextAreaField from "@/components/admin/fields/TextAreaField";
import TextField from "@/components/admin/fields/TextField";
import AdminSection from "@/components/admin/layout/AdminSection";

interface Props {
  settings: Settings;
}

export default function SEOSection({ settings }: Props) {
  return (
    <AdminSection
      title="Default SEO"
      description="Fallback search metadata used across the website."
    >
      <TextField
        label="SEO Title"
        name="seoTitle"
        defaultValue={settings.seoTitle}
      />

      <TextAreaField
        label="SEO Description"
        rows={4}
        name="seoDescription"
        defaultValue={settings.seoDescription}
      />

      <TextAreaField
        label="SEO Keywords"
        rows={3}
        name="seoKeywords"
        defaultValue={settings.seoKeywords}
      />
    </AdminSection>
  );
}