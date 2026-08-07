
import AdminPage from "@/components/admin/layout/AdminPage";
import EmptyState from "@/components/admin/common/EmptyState";

import MessageTable from "@/components/admin/messages/MessageTable";

import { getMessages } from "@/lib/actions/message.actions";

export default async function MessagesPage() {
  const messages = await getMessages();

  return (
    <AdminPage
      title="Messages"
      description="View and manage enquiries received from your website."
    >
      {messages.length === 0 ? (
        <EmptyState
          title="No Messages"
          description="You haven't received any enquiries yet."
        />
      ) : (
        <MessageTable messages={messages} />
      )}
    </AdminPage>
  );
}