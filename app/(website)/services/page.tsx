import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { prisma } from "@/lib/prisma";
import { getSeoPageMetadata } from "@/lib/seo";
import PageHero from "@/components/website/shared/PageHero";
import Container from "@/components/ui/Container";
import { websiteDesign } from "@/components/website/shared/design";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoPageMetadata({
    pageKey: "services",
    routePath: "/services",
  });
}

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      displayOrder: "asc",
    },
  });

  return (
    <main className="bg-white">
      <PageHero
        title="Our Services"
        subtitle="What We Offer"
        description="From concept to completion, we deliver high-quality construction solutions tailored to your requirements."
      />

      <section className={websiteDesign.sectionY}>
        <Container>
          <div className="mx-auto grid max-w-fit justify-center gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.id}
                className={`${websiteDesign.card} w-95`}
              >
                {service.image && (
                  <Image
                    src={service.image}
                    alt={service.title}
                    width={600}
                    height={400}
                    className="h-56 w-full object-cover"
                  />
                )}

                <div className="p-6">
                  <h2 className="text-2xl font-bold">
                    {service.title}
                  </h2>

                  <p className="mt-4 text-slate-600">
                    {service.shortDescription}
                  </p>

                  <Link
                    href={`/services/${service.slug}`}
                    className="mt-6 inline-flex font-semibold text-primary hover:underline"
                  >
                    Read More →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
