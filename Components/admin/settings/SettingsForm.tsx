"use client";

import { updateSettings } from "@/lib/actions/settings.actions";

import CompanySection from "./CompanySection";
import ContactSection from "./ContactSection";
import HeroSection from "./HeroSection";
import StatisticsSection from "./StatisticsSection";
import SocialSection from "./SocialSection";
import SEOSection from "./SEOSection";

interface SettingsFormProps {
  settings: any;
}

export default function SettingsForm({
  settings,
}: SettingsFormProps) {
  return (
    <form
      action={updateSettings}
      className="space-y-8"
    >
      <CompanySection settings={settings} />

      <ContactSection settings={settings} />

      <HeroSection settings={settings} />

      <StatisticsSection settings={settings} />

      <SocialSection settings={settings} />

      <SEOSection settings={settings} />

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
        >
          Save Settings
        </button>
      </div>
    </form>
  );
}