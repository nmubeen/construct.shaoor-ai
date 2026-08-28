"use client";

import type { Settings } from "@prisma/client";

import ImageUpload from "@/components/admin/common/ImageUpload";
import AdminSection from "@/components/admin/layout/AdminSection";
import TextField from "@/components/admin/fields/TextField";

interface Props {
  settings: Pick<Settings, "companyName" | "tagline" | "website" | "logo">;
}

export default function CompanySection({
  settings,
}: Props) {
  return (
    <AdminSection
      title="Company Information"
      description="Basic company details shown throughout the website."
    >
      <TextField
        label="Company Name"
        name="companyName"
        defaultValue={settings.companyName ?? ""}
        required
      />

      <TextField
        label="Tagline"
        name="tagline"
        defaultValue={settings.tagline ?? ""}
      />

      <TextField
        label="Website"
        name="website"
        type="url"
        defaultValue={settings.website ?? ""}
      />

      <ImageUpload
        label="Logo"
        name="logo"
        defaultValue={settings.logo ?? ""}
        helperText="Select the company logo from your Media Library."
      />
    </AdminSection>
  );
}
