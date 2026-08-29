import Link from "next/link";
import { FaEye } from "react-icons/fa6";

import DeleteMessageButton from "@/components/admin/messages/DeleteMessageButton";
import MessageStatusBadge from "@/components/admin/messages/MessageStatusBadge";

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  isRead: boolean;
  isReplied: boolean;
  createdAt: Date;
}

interface MessageTableProps {
  messages: Message[];
}

function formatDate(date: Date) {
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-GB", {
    month: "short",
  });
  const year = d.getFullYear();
  const time = d
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  return `${day}-${month}-${year} ${time}`;
}

export default function MessageTable({
  messages,
}: MessageTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Name
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Email
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Subject
            </th>

            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
              Status
            </th>

            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
              Received
            </th>

            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {messages.map((message) => (
            <tr
              key={message.id}
              className={`transition hover:bg-slate-50 ${
                !message.isRead
                  ? "bg-blue-50 font-semibold"
                  : ""
              }`}
            >
              <td className="px-6 py-4">
                {message.name}
              </td>

              <td className="px-6 py-4">
                {message.email}
              </td>

              <td className="px-6 py-4">
                {message.subject || "-"}
              </td>

              <td className="px-6 py-4 text-center">
                <MessageStatusBadge
                  status={
                    message.isReplied
                      ? "Replied"
                      : message.isRead
                      ? "Read"
                      : "New"
                  }
                />
              </td>

              <td className="px-6 py-4 text-center">
                {formatDate(message.createdAt)}
              </td>

              <td className="px-6 py-4">
                <div className="flex justify-end gap-4">
                  <Link
                    href={`/admin/messages/${message.id}`}
                    className="text-slate-600 transition hover:text-[#0E4A7B]"
                    title="View Message"
                  >
                    <FaEye
                      size={18}
                      className="font-normal"
                    />
                  </Link>

                  <DeleteMessageButton id={message.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
