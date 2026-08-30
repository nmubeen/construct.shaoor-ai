import type { Metadata } from "next";

import Header from "@/components/website/layout/Header";
import Footer from "@/components/website/layout/Footer";
import { getDefaultSEO, resolveBaseUrl } from "@/lib/seo";
import { getPublicSiteSettings } from "@/lib/public-site-data";
import JsonLd from "@/components/shared/JsonLd";
import { buildWebsiteSchema } from "@/lib/schema";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { resolvePublicConstructOrganization } from "@/lib/construct-public-tenant";
import { isConstructPortalRequest } from "@/lib/construct-host";

import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  if (await isConstructPortalRequest()) {
    return {
      title: "Shaoor Construct | Construction websites made manageable",
      description:
        "Launch and manage a professional construction company website with a secure, plan-controlled CMS.",
      robots: { index: true, follow: true },
    };
  }
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
        ? [
            seo.ogImage.startsWith("/")
              ? new URL(seo.ogImage, `${baseUrl}/`).toString()
              : seo.ogImage,
          ]
        : undefined,
    },
    twitter: {
      card: seo.ogImage ? "summary_large_image" : "summary",
      title: seo.ogTitle,
      description: seo.ogDescription,
      site: seo.twitterHandle ?? undefined,
      images: seo.ogImage
        ? [
            seo.ogImage.startsWith("/")
              ? new URL(seo.ogImage, `${baseUrl}/`).toString()
              : seo.ogImage,
          ]
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

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await isConstructPortalRequest()) return <>{children}</>;
  const organization = await resolvePublicConstructOrganization();
  if (organization) {
    const publication = await getConstructPrisma().sitePublication.findUnique({
      where: { organizationId: organization.id },
    });
    if (publication?.status !== "PUBLISHED") {
      return (
        <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-teal-400">
              Shaoor Construct
            </p>
            <h1 className="mt-4 text-3xl font-bold">Website coming soon</h1>
            <p className="mt-3 text-sm text-slate-400">
              This website is not currently published.
            </p>
          </div>
        </main>
      );
    }
    return (
      <>
        <Header />
        <WebsiteStructuredData />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </>
    );
  }
  return (
    <>
      <Header />

      <WebsiteStructuredData />

      <main className="min-h-screen">{children}</main>

      <Footer />
    </>
  );
}

async function WebsiteStructuredData() {
  const [seo, settings] = await Promise.all([
    getDefaultSEO(),
    getPublicSiteSettings(),
  ]);

  return <JsonLd data={buildWebsiteSchema({ seo, settings })} />;
}
