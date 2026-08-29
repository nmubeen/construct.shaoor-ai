"use client";

import type { Settings } from "@prisma/client";

import ImageUpload from "@/components/admin/common/ImageUpload";
import AdminSection from "@/components/admin/layout/AdminSection";
import TextField from "@/components/admin/fields/TextField";

export default function HeroSection({
  settings,
}: {
  settings: Pick<Settings, "heroTitle" | "heroSubtitle" | "heroImage" | "ctaButtonText" | "ctaButtonLink">;
}) {
  return (
    <AdminSection
      title="Homepage Hero"
      description="Main banner displayed on the homepage."
    >
      <TextField
        label="Hero Title"
        name="heroTitle"
        defaultValue={settings.heroTitle ?? ""}
      />

      <TextField
        label="Hero Subtitle"
        name="heroSubtitle"
        defaultValue={settings.heroSubtitle ?? ""}
      />

      <ImageUpload
        label="Hero Image"
        name="heroImage"
        defaultValue={settings.heroImage ?? ""}
        helperText="Select the homepage hero image from your Media Library."
      />

      <TextField
        label="CTA Button Text"
        name="ctaButtonText"
        defaultValue={settings.ctaButtonText ?? ""}
      />

      <TextField
        label="CTA Button Link"
        name="ctaButtonLink"
        defaultValue={settings.ctaButtonLink ?? ""}
      />
    </AdminSection>
  );
}
