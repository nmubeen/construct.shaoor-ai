"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelConstructSubscription } from "@/lib/actions/construct-billing.actions";

// Ported from pets.shaoor-ai.com/components/billing/CancelSubscriptionButton.tsx.
export function CancelSubscriptionButton({ organizationId, className }: { organizationId: string; className: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1.5">
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm("Cancel your subscription? You'll keep this plan through the period you've already paid for.")) {
            return;
          }
          startTransition(async () => {
            const result = await cancelConstructSubscription(organizationId);
            if (result?.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
        className={className}
      >
        {pending ? "Cancelling…" : "Cancel plan"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
