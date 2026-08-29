import Image from "next/image";
import Link from "next/link";
import { FaPenToSquare } from "react-icons/fa6";

import DeleteClientButton from "./DeleteClientButton";
import StatusBadge from "@/components/admin/common/StatusBadge";

interface Client {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  website?: string | null;
  category?: string | null;
  displayOrder: number;
  featured: boolean;
  active: boolean;
}

interface Props {
  clients: Client[];
}

export default function ClientTable({ clients }: Props) {
  return (
    <table className="min-w-full">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-4 text-left">Logo</th>
          <th className="p-4 text-left">Name</th>
          <th className="p-4 text-left">Category</th>
          <th className="p-4 text-left">Status</th>
          <th className="p-4 text-center">Featured</th>
          <th className="p-4 text-center">Order</th>
          <th className="p-4 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {clients.map((client) => (
          <tr key={client.id} className="border-t">
            <td className="p-4">
              {client.logo ? (
                <Image
                  src={client.logo}
                  alt={client.name}
                  width={60}
                  height={60}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                  No Logo
                </div>
              )}
            </td>

            <td className="p-4">
              <div className="font-medium">
                {client.name}
              </div>

              <div className="text-sm text-slate-500">
                {client.slug}
              </div>
            </td>

            <td className="p-4">
              {client.category || "—"}
            </td>

            <td className="p-4">
              <StatusBadge
                status={
                  client.active
                    ? "Active"
                    : "Inactive"
                }
              />
            </td>

            <td className="p-4 text-center">
              {client.featured ? "Yes" : "No"}
            </td>

            <td className="p-4 text-center">
              {client.displayOrder}
            </td>

            <td className="p-4 text-right">
              <div className="flex justify-end gap-4">
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="text-slate-600 transition hover:text-[#0E4A7B]"
                  title="Edit"
                >
                  <FaPenToSquare size={18} />
                </Link>

                <DeleteClientButton id={client.id} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
