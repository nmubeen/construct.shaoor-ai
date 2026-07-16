import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
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

  return (
    <main className="bg-white">

      {/* Hero */}

      <section className="bg-slate-900 py-20 text-white">

        <div className="mx-auto max-w-7xl px-6">

          <Link
            href="/services"
            className="text-slate-300 hover:text-white"
          >
            ← Back to Services
          </Link>

          <h1 className="mt-6 text-5xl font-bold">
            {service.title}
          </h1>

        </div>

      </section>

      {/* Content */}

      <section className="mx-auto max-w-5xl px-6 py-16">

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

      </section>

      {/* Related Services */}

      {relatedServices.length > 0 && (

        <section className="bg-slate-50 py-16">

          <div className="mx-auto max-w-7xl px-6">

            <h2 className="mb-8 text-3xl font-bold">
              Related Services
            </h2>

            <div className="grid gap-8 md:grid-cols-3">

              {relatedServices.map((item) => (

                <Link
                  key={item.id}
                  href={`/services/${item.slug}`}
                  className="rounded-xl border bg-white p-6 shadow transition hover:shadow-lg"
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

          </div>

        </section>

      )}

      {/* CTA */}

      <section className="bg-[#0E4A7B] py-16 text-center text-white">

        <h2 className="text-3xl font-bold">
          Ready to discuss your project?
        </h2>

        <p className="mt-4">
          Contact our team for a free consultation.
        </p>

        <Link
          href="/contact"
          className="mt-8 inline-block rounded-lg bg-white px-8 py-4 font-semibold text-[#0E4A7B] hover:bg-slate-100"
        >
          Get a Quote
        </Link>

      </section>

    </main>
  );
}