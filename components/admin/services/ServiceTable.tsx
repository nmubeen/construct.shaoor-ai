import Image from "next/image";
import Link from "next/link";
import { FaPenToSquare } from "react-icons/fa6";

import DeleteServiceButton from "./DeleteServiceButton";
import StatusBadge from "@/components/admin/common/StatusBadge";

interface Service {
  id: number;
  title: string;
  slug: string;
  image?: string | null;
  displayOrder: number;
  isActive: boolean;
}

interface Props {
  services: Service[];
}

export default function ServiceTable({ services }: Props) {
  return (
    <table className="min-w-full">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-4 text-left">Image</th>
          <th className="p-4 text-left">Title</th>
          <th className="p-4 text-left">Status</th>
          <th className="p-4 text-center">Order</th>
          <th className="p-4 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {services.map((service) => (
          <tr key={service.id} className="border-t">
            <td className="p-4">
              {service.image ? (
                <Image
                  src={service.image}
                  alt={service.title}
                  width={60}
                  height={60}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                  No Image
                </div>
              )}
            </td>

            <td className="p-4">
              <div className="font-medium">{service.title}</div>
              <div className="text-sm text-slate-500">{service.slug}</div>
            </td>

            <td className="p-4">
              <StatusBadge
                status={service.isActive ? "Active" : "Inactive"}
              />
            </td>

            <td className="p-4 text-center">{service.displayOrder}</td>

            <td className="p-4 text-right">
              <div className="flex justify-end gap-4">
                <Link
                  href={`/admin/services/${service.id}`}
                  className="text-slate-600 transition hover:text-[#0E4A7B]"
                  title="Edit"
                >
                  <FaPenToSquare size={18} />
                </Link>

                <DeleteServiceButton id={service.id} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
