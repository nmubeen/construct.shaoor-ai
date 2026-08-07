import Link from "next/link";
import { FaPenToSquare } from "react-icons/fa6";

import DeleteFAQButton from "./DeleteFAQButton";
import StatusBadge from "@/components/admin/common/StatusBadge";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category?: string | null;
  featured: boolean;
  active: boolean;
  displayOrder: number;
}

interface Props {
  faqs: FAQ[];
}

export default function FAQTable({ faqs }: Props) {
  return (
    <table className="min-w-full">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-4 text-left">Question</th>
          <th className="p-4 text-left">Category</th>
          <th className="p-4 text-left">Status</th>
          <th className="p-4 text-center">Featured</th>
          <th className="p-4 text-center">Order</th>
          <th className="p-4 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {faqs.map((faq) => (
          <tr key={faq.id} className="border-t">
            <td className="p-4">
              <div className="font-medium">
                {faq.question}
              </div>

              <div className="line-clamp-2 text-sm text-slate-500">
                {faq.answer}
              </div>
            </td>

            <td className="p-4">
              {faq.category || "—"}
            </td>

            <td className="p-4">
              <StatusBadge
                status={
                  faq.active
                    ? "Active"
                    : "Inactive"
                }
              />
            </td>

            <td className="p-4 text-center">
              {faq.featured ? "Yes" : "No"}
            </td>

            <td className="p-4 text-center">
              {faq.displayOrder}
            </td>

            <td className="p-4 text-right">
              <div className="flex justify-end gap-4">
                <Link
                  href={`/admin/faq/${faq.id}`}
                  className="text-slate-600 transition hover:text-[#0E4A7B]"
                  title="Edit"
                >
                  <FaPenToSquare size={18} />
                </Link>

                <DeleteFAQButton id={faq.id} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
