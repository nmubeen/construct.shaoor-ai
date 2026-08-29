import Link from "next/link";
import { FaPenToSquare } from "react-icons/fa6";

interface SeoPageRow {
  id: number;
  pageKey: string;
  pageName: string;
  title: string;
  description: string;
  updatedAt: Date;
}

interface SeoPagesTableProps {
  pages: SeoPageRow[];
}

export default function SeoPagesTable({ pages }: SeoPagesTableProps) {
  return (
    <table className="min-w-full">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-4 text-left">Page</th>
          <th className="p-4 text-left">Title</th>
          <th className="p-4 text-left">Description</th>
          <th className="p-4 text-left">Updated</th>
          <th className="p-4 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {pages.map((page) => (
          <tr key={page.id} className="border-t">
            <td className="p-4">
              <div className="font-medium text-slate-900">{page.pageName}</div>
              <div className="text-sm text-slate-500">/{page.pageKey}</div>
            </td>

            <td className="p-4 text-sm text-slate-700">{page.title}</td>

            <td className="p-4 text-sm text-slate-600">
              <p className="line-clamp-2">{page.description}</p>
            </td>

            <td className="p-4 text-sm text-slate-600">
              {new Date(page.updatedAt).toLocaleDateString()}
            </td>

            <td className="p-4 text-right">
              <div className="flex justify-end gap-4">
                <Link
                  href={`/admin/seo/${page.pageKey}`}
                  className="text-slate-600 transition hover:text-[#0E4A7B]"
                  title="Edit"
                >
                  <FaPenToSquare size={18} />
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
