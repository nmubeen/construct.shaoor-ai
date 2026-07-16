import Link from "next/link";
import Image from "next/image";

import { prisma } from "@/lib/prisma";

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
      {/* Hero */}
      <section className="bg-slate-900 py-8 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="text-4xl font-bold">
            Our Services
          </h1>

          <p className="mt-6 max-w-3xl text-lg text-slate-200">
            From concept to completion, we deliver
            high-quality construction solutions tailored
            to your requirements.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mx-auto grid max-w-fit gap-8 md:grid-cols-2 lg:grid-cols-3 justify-center">
          {services.map((service) => (
            <article
              key={service.id}
              className="w-95 overflow-hidden rounded-xl border bg-white shadow transition hover:-translate-y-1 hover:shadow-lg"
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
                  className="mt-6 inline-flex font-semibold text-[#0E4A7B] hover:underline"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}