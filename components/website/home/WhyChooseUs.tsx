import PageSection from "@/components/website/shared/PageSection";
import SectionHeader from "@/components/website/shared/SectionHeader";
import { websiteDesign } from "@/components/website/shared/design";
import { getPublicSiteSettings, getPublicWhyChooseUsHighlights } from "@/lib/public-site-data";
import { WEBSITE_ICONS, DEFAULT_WEBSITE_ICON_KEY } from "@/lib/website-icons";

export default async function WhyChooseUs() {
  const [settings, highlights] = await Promise.all([
    getPublicSiteSettings(),
    getPublicWhyChooseUsHighlights(),
  ]);

  if (highlights.length === 0) return null;

  return (
    <PageSection className="bg-slate-50">
      <SectionHeader
        eyebrow="Why Choose Us"
        title={settings.whyChooseUsTitle}
        subtitle={settings.whyChooseUsSubtitle}
        align="left"
      />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {highlights.map((highlight) => {
            const Icon = (WEBSITE_ICONS[highlight.icon] ?? WEBSITE_ICONS[DEFAULT_WEBSITE_ICON_KEY]).icon;

            return (
              <div
                key={highlight.id}
                className={websiteDesign.card}
              >
                <div className="m-8 mb-0 inline-flex rounded-md bg-[var(--site-primary)] p-4 text-2xl text-white">
                  <Icon />
                </div>

                <h3 className="mb-4 mt-6 px-8 text-xl font-bold">
                  {highlight.title}
                </h3>

                <p className="px-8 pb-8 leading-7 text-slate-600">
                  {highlight.description}
                </p>
              </div>
            );
          })}

        </div>
    </PageSection>
  );
}
