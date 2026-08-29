"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  markMessageAsRead,
  markMessageAsUnread,
} from "@/lib/actions/message.actions";

import { notify } from "@/lib/toast";
import { Messages, Entity } from "@/lib/messages";

interface Props {
  id: number;
  isRead: boolean;
}

export default function MarkReadButton({
  id,
  isRead,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      try {
        if (isRead) {
          await markMessageAsUnread(id);
        } else {
          await markMessageAsRead(id);
        }

        notify.success(Messages.updated(Entity.message));
        router.push("/admin/messages");
      } catch (error) {
        notify.error(
          error instanceof Error ? error.message : Messages.unexpected
        );
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="rounded-lg bg-slate-700 px-4 py-2 text-white transition hover:bg-slate-800 disabled:opacity-50"
    >
      {isPending ? "Saving..." : isRead ? "Mark Unread" : "Mark Read"}
    </button>
  );
}
