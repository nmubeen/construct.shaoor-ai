"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function CopyInvitationLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="rounded-xl border border-teal-200 bg-teal-50 p-4"><p className="text-sm font-semibold text-teal-900">Invitation link created</p><p className="mt-1 text-xs text-teal-800">Copy and send this one-time link to the invited person. It expires in seven days.</p><div className="mt-3 flex gap-2"><input readOnly value={link} className="min-w-0 flex-1 rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs" /><button type="button" onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); }} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white"><Copy className="size-3.5" />{copied ? "Copied" : "Copy"}</button></div></div>;
}
