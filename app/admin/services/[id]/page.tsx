import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import ServiceForm from "@/components/admin/services/ServiceForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditServicePage({
  params,
}: PageProps) {
  const { id } = await params;

  const service = await prisma.service.findUnique({
    where: {
      id,
    },
  });

  if (!service) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Edit Service
        </h1>

        <p className="mt-2 text-slate-500">
          Update service details.
        </p>
      </div>

      <ServiceForm
        mode="edit"
        service={service}
      />
    </div>
  );
}