import type { Metadata } from "next";

import Container from "@/components/ui/Container";
import PageBanner from "@/components/shared/PageBanner";
import ContactForm from "@/components/website/contact/ContactForm";
import ContactInfo from "@/components/website/contact/ContactInfo";
import CTA from "@/components/website/home/CTA";
import { websiteDesign } from "@/components/website/shared/design";

import { getSeoPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

function getGoogleMapsEmbedUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);

    if (
      !url.hostname.includes("google.") ||
      !url.pathname.includes("/maps/embed")
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return getSeoPageMetadata({
    pageKey: "contact",
    routePath: "/contact",
  });
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const mapsEmbedUrl = settings?.googleMapsUrl
    ? getGoogleMapsEmbedUrl(settings.googleMapsUrl)
    : null;

  if (!settings) return null;

  return (
    <>
      <PageBanner
        title="Contact Us"
        subtitle="Let's Build Together"
      />

      <section className={websiteDesign.sectionY}>
        <Container>
          <div className="grid gap-16 lg:grid-cols-2">
            <ContactForm />

            <ContactInfo settings={settings} />
          </div>
        </Container>
      </section>

      {settings.googleMapsUrl && (
        <section className={`bg-slate-200 ${websiteDesign.sectionY}`}>
          <Container>
            <div className="overflow-hidden rounded-2xl shadow-lg">
              {mapsEmbedUrl ? (
                <iframe
                  src={mapsEmbedUrl}
                  width="100%"
                  height="450"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="border-0"
                />
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 bg-slate-100 px-6 py-12 text-center text-slate-700">
                  <p className="max-w-xl text-lg font-medium">
                    Open our location in Google Maps to view the full route and
                    directions.
                  </p>

                  <a
                    href={settings.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open in Google Maps
                  </a>
                </div>
              )}
            </div>
          </Container>
        </section>
      )}

      <CTA settings={settings} />
    </>
  );
}
