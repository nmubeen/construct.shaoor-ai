import Image from "next/image";
import Link from "next/link";
import { FaPen } from "react-icons/fa6";

import { prisma } from "@/lib/prisma";
import DeleteServiceButton from "@/components/admin/services/DeleteServiceButton";

export default async function ServicesPage() {
  const services =
    await prisma.service.findMany({
      orderBy: {
        displayOrder: "asc",
      },
    });

  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between">

        <h1 className="text-3xl font-bold">
          Services
        </h1>

        <Link
          href="/admin/services/new"
          className="rounded-lg bg-[#0E4A7B] px-5 py-3 text-white hover:bg-[#0A365A]"
        >
          + New Service
        </Link>

      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr className="text-left text-sm font-semibold text-slate-700">

              <th className="p-4">
                Image
              </th>

              <th className="p-4">
                Title
              </th>

              <th className="p-4">
                Order
              </th>

              <th className="p-4">
                Status
              </th>

              <th className="p-4">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {services.length > 0 ? (
              services.map(
                (service) => (
                  <tr
                    key={service.id}
                    className="border-t hover:bg-slate-50"
                  >
                    <td className="p-4">

                      <Image
                        src={
                          service.image ||
                          "/images/default-service.jpg"
                        }
                        alt={
                          service.title
                        }
                        width={90}
                        height={60}
                        className="rounded-lg border object-cover"
                      />

                    </td>

                    <td className="p-4">

                      <div className="font-semibold">
                        {
                          service.title
                        }
                      </div>

                      <div className="text-sm text-slate-500">
                        {
                          service.slug
                        }
                      </div>

                    </td>

                    <td className="p-4">
                      {
                        service.displayOrder
                      }
                    </td>

                    <td className="p-4">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          service.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {service.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </td>

                    <td className="p-4">

                      <div className="flex items-center gap-4">

                        <Link
                          href={`/admin/services/${service.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaPen />
                        </Link>

                        <DeleteServiceButton
                          id={
                            service.id
                          }
                        />

                      </div>

                    </td>

                  </tr>
                )
              )
            ) : (
              <tr>

                <td
                  colSpan={5}
                  className="p-10 text-center text-slate-500"
                >
                  No services found.
                </td>

              </tr>
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}