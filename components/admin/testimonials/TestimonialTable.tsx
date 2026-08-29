import Image from "next/image";
import Link from "next/link";
import { FaPenToSquare } from "react-icons/fa6";

import DeleteTestimonialButton from "./DeleteTestimonialButton";
import StatusBadge from "@/components/admin/common/StatusBadge";

interface Testimonial {
  id: number;
  clientName: string;
  company?: string | null;
  designation?: string | null;
  photo?: string | null;
  rating: number;
  projectName?: string | null;
  featured: boolean;
  active: boolean;
  displayOrder: number;
}

interface Props {
  testimonials: Testimonial[];
}

export default function TestimonialTable({
  testimonials,
}: Props) {
  return (
    <table className="min-w-full">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-4 text-left">Photo</th>
          <th className="p-4 text-left">Client</th>
          <th className="p-4 text-left">Company</th>
          <th className="p-4 text-center">Rating</th>
          <th className="p-4 text-left">Status</th>
          <th className="p-4 text-center">Featured</th>
          <th className="p-4 text-center">Order</th>
          <th className="p-4 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {testimonials.map((item) => (
          <tr key={item.id} className="border-t">
            <td className="p-4">
              {item.photo ? (
                <Image
                  src={item.photo}
                  alt={item.clientName}
                  width={60}
                  height={60}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                  No Photo
                </div>
              )}
            </td>

            <td className="p-4">
              <div className="font-medium">
                {item.clientName}
              </div>

              <div className="text-sm text-slate-500">
                {item.designation || "—"}
              </div>
            </td>

            <td className="p-4">
              {item.company || "—"}
            </td>

            <td className="p-4 text-center">
              {item.rating}/5
            </td>

            <td className="p-4">
              <StatusBadge
                status={
                  item.active
                    ? "Active"
                    : "Inactive"
                }
              />
            </td>

            <td className="p-4 text-center">
              {item.featured ? "Yes" : "No"}
            </td>

            <td className="p-4 text-center">
              {item.displayOrder}
            </td>

            <td className="p-4 text-right">
              <div className="flex justify-end gap-4">
                <Link
                  href={`/admin/testimonials/${item.id}`}
                  className="text-slate-600 transition hover:text-[#0E4A7B]"
                  title="Edit"
                >
                  <FaPenToSquare size={18} />
                </Link>

                <DeleteTestimonialButton id={item.id} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
