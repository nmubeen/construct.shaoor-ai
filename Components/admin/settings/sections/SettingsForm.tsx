"use client";

import type { Settings } from "@prisma/client";

import { updateSettings } from "@/lib/actions/settings.actions";

import FormActions from "@/components/admin/forms/FormActions";

import CompanySection from "@/components/admin/settings/sections/CompanySection";
import ContactSection from "@/components/admin/settings/sections/ContactSection";
import HeroSection from "@/components/admin/settings/sections/HeroSection";
import StatisticsSection from "@/components/admin/settings/sections/StatisticsSection";
import SocialSection from "@/components/admin/settings/sections/SocialSection";
import SEOSection from "@/components/admin/settings/sections/SEOSection";
import { notify } from "@/lib/toast";
import { Messages } from "@/lib/messages";

interface SettingsFormProps {
  settings: Settings;
}

export default function SettingsForm({
  settings,
}: SettingsFormProps) {
  async function handleSubmit(formData: FormData) {
    try {
      await updateSettings(formData);
      notify.success(Messages.saved);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : Messages.saveFailed);
    }
  }

  return (
    <form action={handleSubmit}>
      <div className="space-y-8">
        <CompanySection settings={settings} />

        <ContactSection settings={settings} />

        <HeroSection settings={settings} />

        <StatisticsSection settings={settings} />

        <SocialSection settings={settings} />

        <SEOSection settings={settings} />

        <FormActions
          submitLabel="Save Settings"
          sticky
        />
      </div>
    </form>
  );
}
