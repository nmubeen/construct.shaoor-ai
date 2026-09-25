"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/construct-client";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { enforceConstructBooleanEntitlement, ConstructEntitlementError } from "@/lib/control/construct-subscription.service";
import { parseStoredAnswers } from "@/lib/enquiry/questions";
import { buildRequirementsSummary, suggestPortfolioProjects } from "@/lib/services/construct-proposal-draft.service";
import { buildConstructProposalSnapshot } from "@/lib/services/construct-proposal-snapshot.service";
import { generateProposalToken } from "@/lib/proposal-token";
import { rupeesToMinorUnits } from "@/lib/proposal-money";

const FEATURE_CODE = "PROJECT_PROPOSALS";

function requireEditor(role: string) {
  if (role === "VIEWER") redirect("/dashboard/messages?error=You do not have permission to manage proposals.");
}
function requireApprover(role: string) {
  if (role !== "OWNER" && role !== "ADMIN") redirect("/dashboard/proposals?error=Only Owners and Admins can approve, publish or revoke a proposal.");
}

async function nextProposalReference(organizationId: string): Promise<string> {
  const count = await getConstructPrisma().proposal.count({ where: { organizationId } });
  return `PRP-${String(count + 1).padStart(4, "0")}`;
}

// --- Create ---------------------------------------------------------

// Available from the enquiry detail screen ("Prepare proposal"). Reuses
// an existing open draft for the same enquiry rather than creating a
// duplicate (the DB's partial unique index on (organizationId,
// enquiryId) WHERE status='DRAFT' is the actual guarantee — this is the
// friendly path, the index is the backstop for a race/double-click).
export async function createConstructProposalFromEnquiryAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const enquiryId = String(formData.get("enquiryId") ?? "");

  try {
    await enforceConstructBooleanEntitlement(context.organizationId, FEATURE_CODE);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) redirect(`/dashboard/messages/${enquiryId}?error=${encodeURIComponent(error.message)}`);
    throw error;
  }

  const prisma = getConstructPrisma();
  const enquiry = await prisma.contactMessage.findFirst({
    where: { id: enquiryId, organizationId: context.organizationId },
    include: { service: true },
  });
  if (!enquiry) redirect("/dashboard/messages?error=Enquiry not found.");

  const existingDraft = await prisma.proposal.findFirst({
    where: { organizationId: context.organizationId, enquiryId, status: "DRAFT" },
    select: { id: true },
  });
  if (existingDraft) redirect(`/dashboard/proposals/${existingDraft.id}`);

  const answers = parseStoredAnswers(enquiry.answers);
  const requirementsSummary = buildRequirementsSummary({
    customerName: enquiry.name,
    serviceTitle: enquiry.service?.title ?? enquiry.projectInterest,
    subService: enquiry.subService,
    projectLocation: enquiry.projectLocation,
    answers,
    message: enquiry.message,
  });
  const suggestions = await suggestPortfolioProjects({
    organizationId: context.organizationId,
    serviceTitle: enquiry.service?.title ?? enquiry.projectInterest,
    serviceDescription: enquiry.service?.shortDescription ?? null,
    answers,
  });

  const reference = await nextProposalReference(context.organizationId);
  const token = generateProposalToken();

  try {
    const proposalId = await prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.create({
        data: {
          organizationId: context.organizationId,
          enquiryId,
          reference,
          title: `Proposal for ${enquiry.name}${enquiry.service ? ` — ${enquiry.service.title}` : ""}`,
          requirementsSummary,
          token,
          createdById: context.userId,
        },
      });
      if (suggestions.length > 0) {
        await tx.proposalPortfolioItem.createMany({
          data: suggestions.map((item, index) => ({
            organizationId: context.organizationId,
            proposalId: proposal.id,
            projectId: item.projectId,
            reason: item.reason,
            sortOrder: index,
          })),
        });
      }
      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          actorUserId: context.userId,
          module: "proposals",
          action: "create",
          recordId: proposal.id,
          title: `Proposal draft created: ${proposal.reference}`,
          details: { enquiryId },
        },
      });
      return proposal.id;
    });
    revalidatePath("/dashboard/proposals");
    redirect(`/dashboard/proposals/${proposalId}`);
  } catch (error) {
    // Partial-unique-index race: another request created the draft first
    // between our check above and this insert — reuse it instead of erroring.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const draft = await prisma.proposal.findFirst({ where: { organizationId: context.organizationId, enquiryId, status: "DRAFT" }, select: { id: true } });
      if (draft) redirect(`/dashboard/proposals/${draft.id}`);
    }
    throw error;
  }
}

// --- Edit draft content ---------------------------------------------

const priceSchema = z.object({
  priceMode: z.enum(["DISCUSS", "FIXED", "RANGE"]),
  priceCurrency: z.string().trim().min(3).max(8),
  priceAmount: z.string().trim(),
  priceMinAmount: z.string().trim(),
  priceMaxAmount: z.string().trim(),
  pricingBasis: z.string().trim().max(200).transform((v) => v || null),
  taxNote: z.string().trim().max(300).transform((v) => v || null),
});

const draftSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(200),
  reference: z.string().trim().min(1).max(40),
  introduction: z.string().trim().max(5000),
  requirementsSummary: z.string().trim().max(8000),
  scopeOfWork: z.string().trim().max(8000),
  exclusions: z.string().trim().max(4000),
  assumptions: z.string().trim().max(4000),
  closingMessage: z.string().trim().max(2000),
  indicativeTimeline: z.string().trim().max(300).transform((v) => v || null),
  expiresAt: z.string().trim().transform((v) => (v ? new Date(v) : null)),
  internalNotes: z.string().trim().max(4000).transform((v) => v || null),
}).merge(priceSchema);

export type SaveProposalDraftState = { error: string } | null;

export async function saveConstructProposalDraftAction(_prevState: SaveProposalDraftState, formData: FormData): Promise<SaveProposalDraftState> {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") return { error: "You do not have permission to manage proposals." };
  const id = String(formData.get("id") ?? "");

  try {
    await enforceConstructBooleanEntitlement(context.organizationId, FEATURE_CODE);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) return { error: error.message };
    throw error;
  }

  const raw = Object.fromEntries(Object.keys(draftSchema.shape).map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = draftSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid proposal." };
  const { priceMode, priceAmount, priceMinAmount, priceMaxAmount, ...rest } = parsed.data;

  let priceAmountMinor: number | null = null;
  let priceMinAmountMinor: number | null = null;
  let priceMaxAmountMinor: number | null = null;
  if (priceMode === "FIXED") {
    priceAmountMinor = rupeesToMinorUnits(priceAmount);
    if (priceAmountMinor === null) return { error: "Enter a valid fixed price." };
  } else if (priceMode === "RANGE") {
    priceMinAmountMinor = rupeesToMinorUnits(priceMinAmount);
    priceMaxAmountMinor = rupeesToMinorUnits(priceMaxAmount);
    if (priceMinAmountMinor === null || priceMaxAmountMinor === null) return { error: "Enter a valid price range." };
    if (priceMinAmountMinor > priceMaxAmountMinor) return { error: "The minimum price must not be greater than the maximum." };
  }

  const prisma = getConstructPrisma();
  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.updateMany({
        where: { id, organizationId: context.organizationId },
        data: { ...rest, priceMode, priceAmountMinor, priceMinAmountMinor, priceMaxAmountMinor },
      });
      if (updated.count !== 1) throw new Error("PROPOSAL_NOT_FOUND");
      await tx.auditLog.create({
        data: { organizationId: context.organizationId, actorUserId: context.userId, module: "proposals", action: "edit", recordId: id, title: `Proposal draft edited: ${rest.reference}` },
      });
    });
  } catch (error) {
    const text = error instanceof Error ? error.message : "";
    return { error: text.includes("PROPOSAL_NOT_FOUND") ? "Proposal not found." : "The proposal could not be saved." };
  }
  revalidatePath(`/dashboard/proposals/${id}`);
  revalidatePath("/dashboard/proposals");
  return null;
}

// --- Portfolio selection ----------------------------------------------

export async function addConstructProposalPortfolioAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const proposalId = String(formData.get("proposalId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const prisma = getConstructPrisma();

  // Verifies both the proposal and the project belong to this org before
  // linking them — never trusts the ids alone.
  const [proposal, project] = await Promise.all([
    prisma.proposal.findFirst({ where: { id: proposalId, organizationId: context.organizationId }, select: { id: true } }),
    prisma.project.findFirst({ where: { id: projectId, organizationId: context.organizationId }, select: { id: true } }),
  ]);
  if (!proposal || !project) redirect(`/dashboard/proposals/${proposalId}?error=Project not found.`);

  const maxOrder = await prisma.proposalPortfolioItem.aggregate({ where: { proposalId }, _max: { sortOrder: true } });
  await prisma.proposalPortfolioItem.upsert({
    where: { proposalId_projectId: { proposalId, projectId } },
    create: { organizationId: context.organizationId, proposalId, projectId, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
    update: {},
  });
  revalidatePath(`/dashboard/proposals/${proposalId}`);
  redirect(`/dashboard/proposals/${proposalId}`);
}

// Plain callable (not a <form action>) — invoked directly from
// ProposalItemList's remove button, which also owns the optimistic
// removal; this just needs to persist it and let Next's automatic
// post-action refresh pick up the change.
export async function removeConstructProposalPortfolioAction(proposalId: string, itemId: string): Promise<{ error?: string }> {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") return { error: "You do not have permission to manage proposals." };
  await getConstructPrisma().proposalPortfolioItem.deleteMany({ where: { id: itemId, organizationId: context.organizationId, proposalId } });
  revalidatePath(`/dashboard/proposals/${proposalId}`);
  return {};
}

export async function reorderConstructProposalPortfolioAction(proposalId: string, orderedItemIds: string[]): Promise<{ error?: string }> {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") return { error: "You do not have permission to manage proposals." };
  const prisma = getConstructPrisma();
  const existing = await prisma.proposalPortfolioItem.findMany({ where: { organizationId: context.organizationId, proposalId }, select: { id: true } });
  if (existing.length !== orderedItemIds.length || !orderedItemIds.every((id) => existing.some((row) => row.id === id))) {
    return { error: "The portfolio list changed. Refresh the page and try again." };
  }
  await prisma.$transaction(orderedItemIds.map((id, index) => prisma.proposalPortfolioItem.updateMany({ where: { id, proposalId, organizationId: context.organizationId }, data: { sortOrder: index } })));
  revalidatePath(`/dashboard/proposals/${proposalId}`);
  return {};
}

// --- Testimonial selection ---------------------------------------------

export async function addConstructProposalTestimonialAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireEditor(context.role);
  const proposalId = String(formData.get("proposalId") ?? "");
  const testimonialId = String(formData.get("testimonialId") ?? "");
  const prisma = getConstructPrisma();

  const [proposal, testimonial] = await Promise.all([
    prisma.proposal.findFirst({ where: { id: proposalId, organizationId: context.organizationId }, select: { id: true } }),
    prisma.testimonial.findFirst({ where: { id: testimonialId, organizationId: context.organizationId }, select: { id: true } }),
  ]);
  if (!proposal || !testimonial) redirect(`/dashboard/proposals/${proposalId}?error=Testimonial not found.`);

  const maxOrder = await prisma.proposalTestimonialItem.aggregate({ where: { proposalId }, _max: { sortOrder: true } });
  await prisma.proposalTestimonialItem.upsert({
    where: { proposalId_testimonialId: { proposalId, testimonialId } },
    create: { organizationId: context.organizationId, proposalId, testimonialId, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
    update: {},
  });
  revalidatePath(`/dashboard/proposals/${proposalId}`);
  redirect(`/dashboard/proposals/${proposalId}`);
}

export async function removeConstructProposalTestimonialAction(proposalId: string, itemId: string): Promise<{ error?: string }> {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") return { error: "You do not have permission to manage proposals." };
  await getConstructPrisma().proposalTestimonialItem.deleteMany({ where: { id: itemId, organizationId: context.organizationId, proposalId } });
  revalidatePath(`/dashboard/proposals/${proposalId}`);
  return {};
}

export async function reorderConstructProposalTestimonialAction(proposalId: string, orderedItemIds: string[]): Promise<{ error?: string }> {
  const context = await requireActiveConstructContext();
  if (context.role === "VIEWER") return { error: "You do not have permission to manage proposals." };
  const prisma = getConstructPrisma();
  const existing = await prisma.proposalTestimonialItem.findMany({ where: { organizationId: context.organizationId, proposalId }, select: { id: true } });
  if (existing.length !== orderedItemIds.length || !orderedItemIds.every((id) => existing.some((row) => row.id === id))) {
    return { error: "The testimonial list changed. Refresh the page and try again." };
  }
  await prisma.$transaction(orderedItemIds.map((id, index) => prisma.proposalTestimonialItem.updateMany({ where: { id, proposalId, organizationId: context.organizationId }, data: { sortOrder: index } })));
  revalidatePath(`/dashboard/proposals/${proposalId}`);
  return {};
}

// --- Approve & publish / revoke ----------------------------------------

// The one real server-enforced transition that makes a proposal
// externally accessible — approving and publishing are the same action
// (see the ProposalStatus comment in the schema for why there's no
// separate "Approved" status). Requires price/timeline to have been
// explicitly confirmed (DISCUSS/RANGE/FIXED all count as explicit —
// nothing is silently defaulted), never generates them.
export async function approveAndPublishConstructProposalAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireApprover(context.role);
  const id = String(formData.get("id") ?? "");

  try {
    await enforceConstructBooleanEntitlement(context.organizationId, FEATURE_CODE);
  } catch (error) {
    if (error instanceof ConstructEntitlementError) redirect(`/dashboard/proposals/${id}?error=${encodeURIComponent(error.message)}`);
    throw error;
  }

  const prisma = getConstructPrisma();
  const proposal = await prisma.proposal.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!proposal) redirect("/dashboard/proposals?error=Proposal not found.");
  if (!proposal.title.trim() || !proposal.scopeOfWork.trim()) redirect(`/dashboard/proposals/${id}?error=${encodeURIComponent("Add a title and scope of work before publishing.")}`);

  const nextRevisionNumber = proposal.currentRevisionNumber + 1;
  const snapshot = await buildConstructProposalSnapshot(id, nextRevisionNumber);

  await prisma.$transaction(async (tx) => {
    await tx.proposalRevision.create({
      data: { organizationId: context.organizationId, proposalId: id, revisionNumber: nextRevisionNumber, snapshot: snapshot as unknown as Prisma.InputJsonValue, publishedById: context.userId },
    });
    await tx.proposal.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        currentRevisionNumber: nextRevisionNumber,
        approvedAt: proposal.approvedAt ?? new Date(),
        publishedAt: new Date(),
        publishedById: context.userId,
        revokedAt: null,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: context.organizationId,
        actorUserId: context.userId,
        module: "proposals",
        action: nextRevisionNumber === 1 ? "publish" : "republish",
        recordId: id,
        title: `Proposal ${nextRevisionNumber === 1 ? "published" : "republished"}: ${proposal.reference} (revision ${nextRevisionNumber})`,
      },
    });
  });

  revalidatePath(`/dashboard/proposals/${id}`);
  revalidatePath("/dashboard/proposals");
  redirect(`/dashboard/proposals/${id}?published=1`);
}

export async function revokeConstructProposalAction(formData: FormData) {
  const context = await requireActiveConstructContext();
  requireApprover(context.role);
  const id = String(formData.get("id") ?? "");
  const prisma = getConstructPrisma();
  const proposal = await prisma.proposal.findFirst({ where: { id, organizationId: context.organizationId } });
  if (!proposal) redirect("/dashboard/proposals?error=Proposal not found.");

  await prisma.$transaction([
    prisma.proposal.update({ where: { id }, data: { status: "REVOKED", revokedAt: new Date() } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "proposals", action: "revoke", recordId: id, title: `Proposal revoked: ${proposal.reference}` } }),
  ]);

  revalidatePath(`/dashboard/proposals/${id}`);
  revalidatePath("/dashboard/proposals");
  redirect(`/dashboard/proposals/${id}?revoked=1`);
}
