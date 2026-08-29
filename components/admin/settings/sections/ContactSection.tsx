"use client";

import type { Settings } from "@prisma/client";

import AdminSection from "@/components/admin/layout/AdminSection";
import TextField from "@/components/admin/fields/TextField";

export default function ContactSection({
  settings,
}: {
  settings: Pick<Settings, "phone" | "email" | "whatsApp" | "addressLine1" | "addressLine2" | "city" | "state" | "country" | "postalCode" | "googleMapsUrl">;
}) {
  return (
    <AdminSection
      title="Contact Information"
      description="Public contact details."
    >
      <TextField
        label="Phone"
        name="phone"
        type="tel"
        defaultValue={settings.phone ?? ""}
      />

      <TextField
        label="Email"
        name="email"
        type="email"
        defaultValue={settings.email ?? ""}
      />

      <TextField
        label="WhatsApp"
        name="whatsApp"
        type="tel"
        defaultValue={settings.whatsApp ?? ""}
      />

      <TextField
        label="Address Line 1"
        name="addressLine1"
        defaultValue={settings.addressLine1 ?? ""}
      />

      <TextField
        label="Address Line 2"
        name="addressLine2"
        defaultValue={settings.addressLine2 ?? ""}
      />

      <TextField
        label="City"
        name="city"
        defaultValue={settings.city ?? ""}
      />

      <TextField
        label="State"
        name="state"
        defaultValue={settings.state ?? ""}
      />

      <TextField
        label="Country"
        name="country"
        defaultValue={settings.country ?? ""}
      />

      <TextField
        label="Postal Code"
        name="postalCode"
        defaultValue={settings.postalCode ?? ""}
      />

      <TextField
        label="Google Maps URL"
        name="googleMapsUrl"
        defaultValue={settings.googleMapsUrl ?? ""}
      />
    </AdminSection>
  );
}
