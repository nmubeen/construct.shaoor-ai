"use client";

import { useActionState, useState } from "react";
import { Copy, KeyRound, RefreshCw, ShieldOff } from "lucide-react";

import { ConfirmActionButton } from "@/components/dashboard/shared/ConfirmActionButton";
import { generateProgressAccessAction, revokeProgressAccessAction, rotateProgressAccessAction } from "@/lib/actions/construct-progress.actions";

function TokenRevealBanner({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-bold uppercase text-amber-900">Copy this link now</p>
      <p className="mt-1 text-xs text-amber-900">This is the only time the full link is shown — it isn&apos;t stored anywhere you can retrieve it again. If you lose it, rotate to generate a new one.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input readOnly value={url} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs" />
        <button
          type="button"
          onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="inline-flex items-center gap-1.5 rounded-md bg-(image:--gradient-button-bg) px-3 py-2 text-xs font-semibold text-white"
        >
          <Copy className="size-3.5" /> {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

export function ProgressAccessPanel({
  projectId,
  publicUrlBase,
  accessEnabled,
  isExpired,
  isRevoked,
  expiresAt,
  canManage,
}: {
  projectId: string;
  publicUrlBase: string;
  accessEnabled: boolean;
  isExpired: boolean;
  isRevoked: boolean;
  expiresAt: Date | null;
  canManage: boolean;
}) {
  const [generateState, generateAction] = useActionState(generateProgressAccessAction, null);
  const [rotateState, rotateAction] = useActionState(rotateProgressAccessAction, null);

  const revealedToken = (generateState && "token" in generateState && generateState.token) || (rotateState && "token" in rotateState && rotateState.token) || null;
  const error = (generateState && "error" in generateState && generateState.error) || (rotateState && "error" in rotateState && rotateState.error) || null;

  if (!canManage) {
    return <p className="text-xs text-slate-500">Only an Owner or Admin can manage customer access.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {revealedToken && <TokenRevealBanner url={`${publicUrlBase}/${revealedToken}`} />}

      <div className="flex items-center gap-2 text-sm">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${accessEnabled ? "bg-[#eef3ec] text-(--color-secondary-text-icon)" : "bg-slate-100 text-slate-500"}`}>
          {isRevoked ? "Revoked" : isExpired ? "Expired" : accessEnabled ? "Enabled" : "Not generated"}
        </span>
        {/* Locale pinned to "en-GB" — this is a Client Component
            (SSR-then-hydrated); an unpinned locale renders differently in
            Node vs the browser, causing a hydration mismatch. */}
        {expiresAt && accessEnabled && <span className="text-xs text-slate-500">Expires {expiresAt.toLocaleDateString("en-GB")}</span>}
      </div>

      {!accessEnabled ? (
        <form action={generateAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <label className="text-xs font-semibold text-slate-600">Expires after (days, optional)
            <input name="expiryDays" type="number" min="1" max="365" placeholder="No expiry" className="mt-1 block w-32 rounded-md border border-slate-300 px-2.5 py-2 text-sm" />
          </label>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-(image:--gradient-button-bg) px-3 py-2 text-xs font-semibold text-white"><KeyRound className="size-3.5" />Generate link</button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <form action={rotateAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <ConfirmActionButton message="Rotate the link? The current link will stop working immediately." className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="size-3.5" />Rotate link</ConfirmActionButton>
          </form>
          <form action={revokeProgressAccessAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <ConfirmActionButton message="Revoke customer access? The link will stop working immediately." className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"><ShieldOff className="size-3.5" />Revoke access</ConfirmActionButton>
          </form>
        </div>
      )}
      <p className="text-xs text-slate-500">Anyone who has this link can open the page — no login is required. Treat it like a private document, not a public page.</p>
    </div>
  );
}
