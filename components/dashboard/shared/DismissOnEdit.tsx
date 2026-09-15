"use client";

import { useEffect, useState } from "react";

// Wraps a server-rendered "saved successfully" banner (driven by a ?saved=
// search param) so it disappears the moment the admin edits any field on
// the page — otherwise it keeps claiming the (now-stale) form state is
// saved while they're mid-edit. Listens page-wide, not just on one form,
// since a page can have several forms/fields sharing one banner.
export function DismissOnEdit({ children }: { children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismiss = () => setDismissed(true);
    document.addEventListener("input", dismiss, { once: true });
    document.addEventListener("change", dismiss, { once: true });
    return () => {
      document.removeEventListener("input", dismiss);
      document.removeEventListener("change", dismiss);
    };
  }, []);

  if (dismissed) return null;
  return <>{children}</>;
}
