import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";

import DashboardPanel from "./DashboardPanel";

interface Message {
  id: number;
  name: string;
  subject: string | null;
  isRead: boolean;
  createdAt: Date;
}

interface Props {
  messages: Message[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

export default function RecentMessages({
  messages,
}: Props) {
  return (
    <DashboardPanel
      title="Recent Messages"
      subtitle="Latest enquiries received"
      action={
        <Link
          href="/admin/messages"
          className="text-sm font-medium text-[#0E4A7B] hover:underline"
        >
          View All
        </Link>
      }
    >
      <div className="space-y-4">
        {messages.map((message) => (
          <Link
            key={message.id}
            href={`/admin/messages/${message.id}`}
            className={`flex items-center justify-between rounded-lg border p-4 transition hover:bg-slate-50 ${
              !message.isRead
                ? "border-blue-200 bg-blue-50"
                : "border-slate-200"
            }`}
          >
            <div>
              <h3
                className={`${
                  !message.isRead
                    ? "font-semibold"
                    : "font-medium"
                }`}
              >
                {message.name}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {message.subject || "No subject"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                {formatDate(message.createdAt)}
              </span>

              <FaArrowRight className="text-slate-400" />
            </div>
          </Link>
        ))}

        {messages.length === 0 && (
          <div className="py-10 text-center text-slate-500">
            No messages received yet.
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}