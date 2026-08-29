import Link from "next/link";
import { FaPenToSquare } from "react-icons/fa6";

import StatusBadge from "@/components/admin/common/StatusBadge";
import DeleteGalleryButton from "@/components/admin/gallery/DeleteGalleryButton";

interface GalleryRow {
  id: number;
  title: string;
  slug: string;
  featured: boolean;
  isActive: boolean;
  updatedAt: Date;
  _count: {
    items: number;
  };
}

interface GalleryTableProps {
  galleries: GalleryRow[];
}

function dateText(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(value);
}

export default function GalleryTable({ galleries }: GalleryTableProps) {
  return (
    <table className="min-w-full">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-4 text-left">Gallery Name</th>
          <th className="p-4 text-center">Images</th>
          <th className="p-4 text-center">Featured</th>
          <th className="p-4 text-left">Status</th>
          <th className="p-4 text-left">Updated</th>
          <th className="p-4 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {galleries.map((gallery) => (
          <tr key={gallery.id} className="border-t">
            <td className="p-4">
              <div className="font-medium text-slate-900">{gallery.title}</div>
              <div className="text-sm text-slate-500">{gallery.slug}</div>
            </td>

            <td className="p-4 text-center">{gallery._count.items}</td>

            <td className="p-4 text-center">{gallery.featured ? "Yes" : "No"}</td>

            <td className="p-4">
              <StatusBadge status={gallery.isActive ? "Active" : "Inactive"} />
            </td>

            <td className="p-4 text-sm text-slate-600">{dateText(gallery.updatedAt)}</td>

            <td className="p-4 text-right">
              <div className="flex justify-end gap-4">
                <Link
                  href={`/admin/gallery/${gallery.id}`}
                  className="text-slate-600 transition hover:text-[#0E4A7B]"
                  title="Edit"
                >
                  <FaPenToSquare size={18} />
                </Link>

                <DeleteGalleryButton id={gallery.id} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
