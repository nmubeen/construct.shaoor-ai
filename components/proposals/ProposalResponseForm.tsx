"use client";

import { useState } from "react";
import { CalendarClock, MessageCircle } from "lucide-react";

import { submitConstructProposalResponseAction } from "@/lib/actions/construct-proposal-response.actions";

const inputClass = "mt-1.5 w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-500/15";

// The two "next steps" the product spec asks for. Deliberately doesn't
// claim a requested visit is booked or a suggested time is accepted —
// the confirmation text below says exactly what happened (a message was
// sent), nothing more.
export function ProposalResponseForm({ token }: { token: string }) {
  const [open, setOpen] = useState<"DISCUSS" | "SITE_VISIT" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"DISCUSS" | "SITE_VISIT" | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!open) return;
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await submitConstructProposalResponseAction({
      token,
      type: open,
      message: String(form.get("message") ?? ""),
      preferredDate: String(form.get("preferredDate") ?? ""),
      preferredTime: String(form.get("preferredTime") ?? ""),
      companyWebsite: String(form.get("companyWebsite") ?? ""),
    });
    setSubmitting(false);
    if (result.ok) setDone(open);
    else setError(result.error);
  }

  if (done) {
    return (
      <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <p className="font-semibold">Thank you — your message has been sent.</p>
        <p className="mt-1 text-sm">{done === "SITE_VISIT" ? "The team will get in touch to confirm a site visit time." : "The team will get back to you shortly to discuss this proposal."}</p>
      </div>
    );
  }

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setOpen("DISCUSS")} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          <MessageCircle className="size-4" /> Discuss this proposal
        </button>
        <button type="button" onClick={() => setOpen("SITE_VISIT")} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <CalendarClock className="size-4" /> Request a site visit
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="hidden" aria-hidden="true"><label>Company website<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label></div>
          <p className="text-sm font-semibold text-slate-800">{open === "SITE_VISIT" ? "Request a site visit" : "Discuss this proposal"}</p>
          <label className="block text-xs font-semibold text-slate-600">Message (optional)
            <textarea name="message" maxLength={2000} rows={3} className={`${inputClass} resize-y`} placeholder="Anything you'd like us to know?" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">Preferred date (optional)
              <input type="date" name="preferredDate" className={inputClass} />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Preferred time (optional)
              <input type="text" name="preferredTime" maxLength={120} placeholder="e.g. weekday mornings" className={inputClass} />
            </label>
          </div>
          <p className="text-xs text-slate-500">This sends a request only — a date or time here isn&apos;t confirmed until the team gets back to you.</p>
          {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{submitting ? "Sending…" : "Send"}</button>
            <button type="button" onClick={() => setOpen(null)} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
