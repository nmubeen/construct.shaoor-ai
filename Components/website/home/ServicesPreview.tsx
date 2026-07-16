import Link from "next/link";
import Image from "next/image";

import { prisma } from "@/lib/prisma";

export default async function ServicesPreview() {
  const services = await prisma.service.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      displayOrder: "asc",
    },
    take: 3,
  });

  if (services.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-20">

      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-14 text-center">

          <h2 className="text-4xl font-bold">
            Our Services
          </h2>

          <p className="mt-4 text-slate-600">
            Comprehensive construction solutions
            tailored to your needs.
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {services.map((service) => (

            <article
              key={service.id}
              className="overflow-hidden rounded-xl border bg-white shadow transition hover:-translate-y-1 hover:shadow-lg"
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

                <h3 className="text-2xl font-bold">
                  {service.title}
                </h3>

                <p className="mt-4 text-slate-600">
                  {service.shortDescription}
                </p>

                <Link
                  href={`/services/${service.slug}`}
                  className="mt-6 inline-block font-semibold text-[#0E4A7B] hover:underline"
                >
                  Learn More →
                </Link>

              </div>

            </article>

          ))}

        </div>

        <div className="mt-14 text-center">

          <Link
            href="/services"
            className="rounded-lg bg-[#0E4A7B] px-8 py-4 font-semibold text-white hover:bg-[#0A365A]"
          >
            View All Services
          </Link>

        </div>

      </div>

    </section>
  );
}