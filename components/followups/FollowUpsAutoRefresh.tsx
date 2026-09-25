"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Lightweight polling while the Follow-ups dashboard is open — the only
// "reminder delivery" v1 provides is in-app (see the page's own help
// text): due/overdue status is derived from persisted data and the
// current time, so a periodic router.refresh() is enough to keep counts
// and badges current without a scheduled job or a real notification
// service. No-op once the tab is hidden/backgrounded, to avoid needless
// server load from an unattended tab.
export function FollowUpsAutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
