import type { Metadata } from "next";

import Header from "@/components/website/layout/Header";
import Footer from "@/components/website/layout/Footer";
import { getDefaultSEO, resolveBaseUrl } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import JsonLd from "@/components/shared/JsonLd";
import { buildWebsiteSchema } from "@/lib/schema";

import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getDefaultSEO();
  const baseUrl = resolveBaseUrl(seo.siteUrl);

  return {
    metadataBase: new URL(baseUrl),
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords ?? undefined,
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      siteName: seo.siteName,
      type: "website",
      images: seo.ogImage
        ? [seo.ogImage.startsWith("/") ? new URL(seo.ogImage, `${baseUrl}/`).toString() : seo.ogImage]
        : undefined,
    },
    twitter: {
      card: seo.ogImage ? "summary_large_image" : "summary",
      title: seo.ogTitle,
      description: seo.ogDescription,
      site: seo.twitterHandle ?? undefined,
      images: seo.ogImage
        ? [seo.ogImage.startsWith("/") ? new URL(seo.ogImage, `${baseUrl}/`).toString() : seo.ogImage]
        : undefined,
    },
    robots: {
      index: seo.robots.index,
      follow: seo.robots.follow,
    },
    verification: {
      google: seo.verification.google ?? undefined,
      other: seo.verification.bing
        ? {
          bing: seo.verification.bing,
        }
        : undefined,
    },
  };
}

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />

      <WebsiteStructuredData />

      <main className="min-h-screen">
        {children}
      </main>

      <Footer />
    </>
  );
}

async function WebsiteStructuredData() {
  const [seo, settings] = await Promise.all([
    getDefaultSEO(),
    getSiteSettings(),
  ]);

  return <JsonLd data={buildWebsiteSchema({ seo, settings })} />;
}
