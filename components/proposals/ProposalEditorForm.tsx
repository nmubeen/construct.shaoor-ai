"use client";

import { useActionState, useState } from "react";

import { saveConstructProposalDraftAction } from "@/lib/actions/construct-proposal.actions";
import { minorUnitsToRupees } from "@/lib/proposal-money";

const input = "mt-1.5 w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#7D9D76] focus:ring-4 focus:ring-[#7D9D76]/25";
const label = "block text-sm font-semibold text-slate-700";
const Hint = ({ children }: { children: React.ReactNode }) => <span className="mt-1 block text-xs font-normal text-slate-500">{children}</span>;

export type EditableProposal = {
  id: string;
  reference: string;
  title: string;
  introduction: string;
  requirementsSummary: string;
  scopeOfWork: string;
  exclusions: string;
  assumptions: string;
  closingMessage: string;
  indicativeTimeline: string | null;
  expiresAt: Date | null;
  internalNotes: string | null;
  priceMode: "DISCUSS" | "FIXED" | "RANGE";
  priceCurrency: string;
  priceAmountMinor: number | null;
  priceMinAmountMinor: number | null;
  priceMaxAmountMinor: number | null;
  pricingBasis: string | null;
  taxNote: string | null;
};

// Bound with useActionState (not a plain <form action>) so a validation
// error re-renders in place without wiping what was typed — same
// convention as ServiceForm/ProjectForm's own save forms.
export function ProposalEditorForm({ proposal, readOnly }: { proposal: EditableProposal; readOnly: boolean }) {
  const [state, formAction] = useActionState(saveConstructProposalDraftAction, null);
  const [priceMode, setPriceMode] = useState(proposal.priceMode);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={proposal.id} />
      {state?.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <label className={label}>Proposal title<input className={input} name="title" defaultValue={proposal.title} required minLength={2} maxLength={200} disabled={readOnly} /></label>
        <label className={label}>Reference<input className={input} name="reference" defaultValue={proposal.reference} required maxLength={40} disabled={readOnly} /></label>
      </div>

      <label className={label}>Customer-facing introduction<Hint>Sets the tone before the requirements and scope.</Hint>
        <textarea className={`${input} min-h-24`} name="introduction" defaultValue={proposal.introduction} maxLength={5000} disabled={readOnly} />
      </label>

      <label className={label}>Requirements summary<Hint>Generated from the enquiry&apos;s answers — edit freely; it&apos;s never regenerated over your changes.</Hint>
        <textarea className={`${input} min-h-32`} name="requirementsSummary" defaultValue={proposal.requirementsSummary} maxLength={8000} disabled={readOnly} />
      </label>

      <label className={label}>Proposed scope of work<textarea className={`${input} min-h-32`} name="scopeOfWork" defaultValue={proposal.scopeOfWork} maxLength={8000} disabled={readOnly} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>Exclusions<textarea className={`${input} min-h-24`} name="exclusions" defaultValue={proposal.exclusions} maxLength={4000} disabled={readOnly} /></label>
        <label className={label}>Assumptions &amp; questions to clarify<textarea className={`${input} min-h-24`} name="assumptions" defaultValue={proposal.assumptions} maxLength={4000} disabled={readOnly} /></label>
      </div>

      <label className={label}>Indicative timeline<Hint>Optional. Confirmed by you — never generated automatically.</Hint>
        <input className={input} name="indicativeTimeline" defaultValue={proposal.indicativeTimeline ?? ""} maxLength={300} placeholder="e.g. 14-16 weeks from site handover" disabled={readOnly} />
      </label>

      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">Pricing</legend>
        <div className="flex flex-wrap gap-3">
          {(["DISCUSS", "FIXED", "RANGE"] as const).map((mode) => (
            <label key={mode} className="flex items-center gap-2 text-sm">
              <input type="radio" name="priceMode" value={mode} checked={priceMode === mode} onChange={() => setPriceMode(mode)} disabled={readOnly} />
              {mode === "DISCUSS" ? "To be discussed" : mode === "FIXED" ? "Fixed amount" : "Indicative range"}
            </label>
          ))}
        </div>
        {priceMode === "FIXED" && (
          <label className={`${label} mt-3`}>Amount<input className={input} name="priceAmount" type="text" inputMode="decimal" defaultValue={proposal.priceAmountMinor !== null ? minorUnitsToRupees(proposal.priceAmountMinor) : ""} placeholder="0.00" disabled={readOnly} /></label>
        )}
        {priceMode === "RANGE" && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className={label}>Minimum<input className={input} name="priceMinAmount" type="text" inputMode="decimal" defaultValue={proposal.priceMinAmountMinor !== null ? minorUnitsToRupees(proposal.priceMinAmountMinor) : ""} placeholder="0.00" disabled={readOnly} /></label>
            <label className={label}>Maximum<input className={input} name="priceMaxAmount" type="text" inputMode="decimal" defaultValue={proposal.priceMaxAmountMinor !== null ? minorUnitsToRupees(proposal.priceMaxAmountMinor) : ""} placeholder="0.00" disabled={readOnly} /></label>
          </div>
        )}
        {priceMode === "DISCUSS" && <input type="hidden" name="priceAmount" value="" />}
        {priceMode !== "RANGE" && <><input type="hidden" name="priceMinAmount" value="" /><input type="hidden" name="priceMaxAmount" value="" /></>}
        <div className="mt-3 grid gap-4 sm:grid-cols-[100px_1fr]">
          <label className={label}>Currency<input className={input} name="priceCurrency" defaultValue={proposal.priceCurrency} maxLength={8} disabled={readOnly} /></label>
          <label className={label}>Pricing basis<input className={input} name="pricingBasis" defaultValue={proposal.pricingBasis ?? ""} maxLength={200} placeholder="e.g. per sq ft, excludes tax" disabled={readOnly} /></label>
        </div>
        <label className={`${label} mt-3`}>Tax clarification<input className={input} name="taxNote" defaultValue={proposal.taxNote ?? ""} maxLength={300} placeholder="e.g. GST extra as applicable" disabled={readOnly} /></label>
      </fieldset>

      <label className={label}>Closing message<textarea className={`${input} min-h-20`} name="closingMessage" defaultValue={proposal.closingMessage} maxLength={2000} disabled={readOnly} /></label>

      <label className={label}>Expiry date<Hint>Optional. After this date the public link shows as expired.</Hint>
        <input className={input} type="date" name="expiresAt" defaultValue={proposal.expiresAt ? proposal.expiresAt.toISOString().slice(0, 10) : ""} disabled={readOnly} />
      </label>

      <label className={label}>Internal notes<Hint>Staff-only — never shown to the customer or included in the published proposal.</Hint>
        <textarea className={`${input} min-h-20 bg-amber-50`} name="internalNotes" defaultValue={proposal.internalNotes ?? ""} maxLength={4000} disabled={readOnly} />
      </label>

      {!readOnly && <div className="flex justify-end"><button className="rounded-md bg-(image:--gradient-button-bg) px-5 py-2.5 text-sm font-semibold text-white">Save draft</button></div>}
    </form>
  );
}
