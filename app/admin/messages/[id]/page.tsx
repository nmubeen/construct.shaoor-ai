import { notFound } from "next/navigation";

import AdminPage from "@/components/admin/layout/AdminPage";
import AdminSection from "@/components/admin/layout/AdminSection";
import MarkReadButton from "@/components/admin/messages/MarkReadButton";
import DeleteMessageButton from "@/components/admin/messages/DeleteMessageButton";

import {
  getMessage,
} from "@/lib/actions/message.actions";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function MessageDetailsPage({
  params,
}: Props) {
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId) || numericId < 1) {
    notFound();
  }

  const message = await getMessage(numericId);

  if (!message) {
    notFound();
  }

  return (
    <AdminPage
      title={message.subject || "Message"}
      description={`Received from ${message.name}`}
    >
      <AdminSection title="Message Details">

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Name
            </label>
            <p>{message.name}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Email
            </label>
            <p>{message.email}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Phone
            </label>
            <p>{message.phone || "-"}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Subject
            </label>
            <p>{message.subject || "-"}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Project Interest
            </label>
            <p>{message.projectInterest || "-"}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Received
            </label>
            <p>
              {message.createdAt.toLocaleString()}
            </p>
          </div>

        </div>

        <div className="mt-8">
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Message
          </label>

          <div className="rounded-lg border bg-slate-50 p-4 whitespace-pre-wrap">
            {message.message}
          </div>
        </div>

      </AdminSection>

      <div className="mt-6 flex flex-wrap gap-3">

      <MarkReadButton
          id={message.id}
          isRead={message.isRead}
      />

        <a
          href={`mailto:${message.email}?subject=Re: ${message.subject ?? ""}`}
          className="rounded-lg bg-[#0E4A7B] px-4 py-2 text-white hover:bg-[#0B3C64]"
        >
          Reply
        </a>

        <DeleteMessageButton id={message.id} />

      </div>
    </AdminPage>
  );
}
