import Link from "next/link";
import Image from "next/image";

import { getPublicServices } from "@/lib/public-site-data";
import PageSection from "@/components/website/shared/PageSection";
import SectionHeader from "@/components/website/shared/SectionHeader";
import { websiteDesign } from "@/components/website/shared/design";

export default async function ServicesPreview() {
  const services = (await getPublicServices()).slice(0, 3);

  if (services.length === 0) {
    return null;
  }

  return (
    <PageSection className="bg-white">
      <SectionHeader
        title="Our Services"
        subtitle="Comprehensive construction solutions tailored to your needs."
        align="left"
      />

      <div className="py-4">
        <Link
          href="/services"
          className={websiteDesign.primaryButton + " text-white!"}
        >
          View All Services
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <article key={service.id} className={websiteDesign.card}>
            {service.image && (
              <Image
                src={service.image}
                alt={service.title}
                width={600}
                height={400}
                className="h-44 w-full object-cover"
              />
            )}

            <div className="p-4">
              <h3 className="text-xl font-bold">{service.title}</h3>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {service.shortDescription}
              </p>

              <Link
                href={`/services/${service.slug}`}
                className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Learn More →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </PageSection>
  );
}
