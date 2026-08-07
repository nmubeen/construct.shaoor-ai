import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getDefaultSEO, getRouteMetadata } from "@/lib/seo";
import PageHero from "@/components/website/shared/PageHero";
import Container from "@/components/ui/Container";
import { websiteDesign } from "@/components/website/shared/design";
import JsonLd from "@/components/shared/JsonLd";
import {
  buildBreadcrumbSchema,
  buildServiceSchema,
} from "@/lib/schema";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const service = await prisma.service.findUnique({
    where: {
      slug,
    },
    select: {
      title: true,
      shortDescription: true,
      description: true,
      image: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      canonicalUrl: true,
      isActive: true,
    },
  });

  if (!service || !service.isActive) {
    const metadata = await getRouteMetadata({
      routePath: `/services/${slug}`,
      title: "Service Details",
    });

    return {
      ...metadata,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return getRouteMetadata({
    routePath: `/services/${slug}`,
    explicitCanonicalUrl: service.canonicalUrl,
    title: service.seoTitle ?? service.title,
    description: service.seoDescription ?? service.shortDescription ?? service.description,
    keywords: service.seoKeywords,
    ogTitle: service.seoTitle ?? service.title,
    ogDescription: service.seoDescription ?? service.shortDescription ?? service.description,
    ogImage: service.image,
  });
}

export default async function ServiceDetailsPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const service = await prisma.service.findUnique({
    where: {
      slug,
    },
  });

  if (!service || !service.isActive) {
    notFound();
  }

  const relatedServices = await prisma.service.findMany({
    where: {
      isActive: true,
      NOT: {
        id: service.id,
      },
    },
    orderBy: {
      displayOrder: "asc",
    },
    take: 3,
  });
  const seo = await getDefaultSEO();
  const baseUrl = new URL(seo.siteUrl).origin;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildServiceSchema({
        seo,
        service: {
          slug: service.slug,
          title: service.title,
          shortDescription: service.shortDescription,
          description: service.description,
          image: service.image,
          seoTitle: service.seoTitle,
          seoDescription: service.seoDescription,
          canonicalUrl: service.canonicalUrl,
        },
      }),
      buildBreadcrumbSchema({
        items: [
          { name: "Home", url: `${baseUrl}/` },
          { name: "Services", url: `${baseUrl}/services` },
          { name: service.title, url: `${baseUrl}/services/${service.slug}` },
        ],
      }),
    ],
  };

  return (
    <main className="bg-white">
      <JsonLd data={jsonLd} />

      <PageHero
        title={service.title}
        subtitle="Service Details"
        backHref="/services"
        backLabel="← Back to Services"
      />

      <section className={websiteDesign.sectionY}>
        <Container className="max-w-5xl">

          {service.image && (
            <Image
              src={service.image}
              alt={service.title}
              width={1200}
              height={700}
              className="mb-10 rounded-xl object-cover"
            />
          )}

          <div className="prose max-w-none">

            <p className="text-lg text-slate-700">
              {service.description}
            </p>

          </div>

        </Container>
      </section>

      {relatedServices.length > 0 && (

        <section className={`${websiteDesign.sectionY} bg-slate-50`}>
          <Container>

            <h2 className="mb-8 text-3xl font-bold">
              Related Services
            </h2>

            <div className="grid gap-8 md:grid-cols-3">

              {relatedServices.map((item) => (

                <Link
                  key={item.id}
                  href={`/services/${item.slug}`}
                  className={`${websiteDesign.card} p-6`}
                >
                  <h3 className="text-xl font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-slate-600">
                    {item.shortDescription}
                  </p>

                </Link>

              ))}

            </div>

          </Container>

        </section>

      )}

      <section className="bg-[#0E4A7B] py-16 text-center text-white!">

        <h2 className="text-3xl font-bold">
          Ready to discuss your project?
        </h2>

        <p className="mt-4">
          Contact our team for a free consultation.
        </p>

        <Link
          href="/contact"
          className="mt-8 inline-block rounded-lg bg-white px-8 py-4 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Get a Quote
        </Link>

      </section>

    </main>
  );
}
