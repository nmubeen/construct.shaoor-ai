"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { z } from "zod";

import { getConstructPrisma } from "@/lib/construct-prisma";
import { resolveConstructProposalByToken } from "@/lib/services/construct-proposal-public.service";

// Public, unauthenticated action — reached only via the bearer link, so
// everything here treats the request as an unverified customer request,
// never confirmed identity or contractual acceptance (per the product
// spec). Rate-limited/duplicate-submit-protected by a short cooldown per
// proposal+type+requester (DB-checked, no new infra), plus the same
// honeypot-field convention the public enquiry form already uses
// (lib/actions/contact.actions.ts's companyWebsite field).
const RESUBMIT_COOLDOWN_MS = 2 * 60 * 1000;

const responseSchema = z.object({
  token: z.string().trim().min(20),
  type: z.enum(["DISCUSS", "SITE_VISIT"]),
  message: z.string().trim().max(2000),
  preferredDate: z.string().trim(),
  preferredTime: z.string().trim().max(120),
  companyWebsite: z.string().max(0),
});

export type ProposalResponseInput = z.input<typeof responseSchema>;
export type ProposalResponseResult = { ok: true } | { ok: false; error: string };

async function hashRequesterIp(): Promise<string | null> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function submitConstructProposalResponseAction(input: ProposalResponseInput): Promise<ProposalResponseResult> {
  const parsed = responseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  const data = parsed.data;

  const resolved = await resolveConstructProposalByToken(data.token);
  // Generic error, same as an invalid link — never confirms whether a
  // token exists to a caller that only has a response payload.
  if (!resolved.ok) return { ok: false, error: "This proposal link is no longer available." };

  const preferredDate = data.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(data.preferredDate) ? new Date(data.preferredDate) : null;
  const requesterIpHash = await hashRequesterIp();
  const prisma = getConstructPrisma();

  if (requesterIpHash) {
    const recent = await prisma.proposalResponse.findFirst({
      where: { proposalId: resolved.proposal.proposalId, type: data.type, requesterIpHash, createdAt: { gt: new Date(Date.now() - RESUBMIT_COOLDOWN_MS) } },
      select: { id: true },
    });
    if (recent) return { ok: true }; // already recorded moments ago — quietly succeed rather than erroring on a double-click
  }

  await prisma.$transaction(async (tx) => {
    await tx.proposalResponse.create({
      data: {
        organizationId: resolved.proposal.organizationId,
        proposalId: resolved.proposal.proposalId,
        revisionNumber: resolved.proposal.revisionNumber,
        type: data.type,
        message: data.message || null,
        preferredDate,
        preferredTime: data.preferredTime || null,
        requesterIpHash,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: resolved.proposal.organizationId,
        module: "proposals",
        action: "customer-response",
        recordId: resolved.proposal.proposalId,
        title: `Customer ${data.type === "SITE_VISIT" ? "requested a site visit" : "asked to discuss"} — ${resolved.proposal.snapshot.reference}`,
      },
    });
  });

  return { ok: true };
}
