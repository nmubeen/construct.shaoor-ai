"use client";

import { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";

// Copy-link and prefilled-WhatsApp actions only — the owner sends
// manually (per the product spec, no automatic email/WhatsApp/paid
// messaging integration in this version). WhatsApp is chosen by
// building a wa.me link with the message pre-filled in the browser's
// share sheet, not by calling any messaging API.
export function ProposalShareActions({ url, customerName, whatsAppNumber }: { url: string; customerName: string; whatsAppNumber?: string | null }) {
  const [copied, setCopied] = useState(false);
  const message = `Hi ${customerName}, here's your proposal from us: ${url}`;
  const whatsAppHref = `https://wa.me/${whatsAppNumber ? whatsAppNumber.replace(/[^\d]/g, "") : ""}?text=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Copy className="size-4" /> {copied ? "Copied!" : "Copy link"}
        </button>
        <a href={whatsAppHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <MessageCircle className="size-4" /> Share via WhatsApp
        </a>
      </div>
      <p className="text-xs text-slate-500">Anyone with this link can view the proposal — treat it like a private document, not a public page.</p>
    </div>
  );
}
