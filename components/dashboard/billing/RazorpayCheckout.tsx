"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Ported from pets.shaoor-ai.com/components/billing/RazorpayCheckout.tsx.
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let scriptPromise: Promise<void> | null = null;

/** Loads Razorpay's Checkout.js once, reused across mounts. */
function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

export function RazorpayCheckout({
  organizationId,
  planCode,
  interval = "monthly",
  workspaceName,
  userEmail,
  className,
  children,
}: {
  organizationId: string;
  planCode: string;
  interval?: "monthly" | "annual";
  workspaceName: string;
  userEmail?: string;
  className: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/razorpay/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, planCode, interval }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      await loadRazorpayScript();

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: "Shaoor Construct",
        description: `${workspaceName} — ${planCode}`,
        prefill: userEmail ? { email: userEmail } : undefined,
        theme: { color: "#0E4A7B" },
        handler: () => {
          // The webhook (app/api/razorpay/webhook) is the actual source of
          // truth for plan state — this redirect is just UX, not trusted.
          router.push("/dashboard/settings?checkout=success");
          router.refresh();
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      razorpay.open();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button disabled={loading} onClick={handleClick} className={className}>
        {loading ? "Loading…" : children}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
