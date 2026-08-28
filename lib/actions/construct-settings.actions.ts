"use server";

import { resolveTxt } from "node:dns/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { getConstructPrisma } from "@/lib/construct-prisma";
import { enforceConstructBooleanEntitlement } from "@/lib/control/construct-subscription.service";

const hostnameSchema = z.string().trim().toLowerCase().max(253).transform(value => value.replace(/\.$/, "")).refine(value => /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value), "Enter a valid hostname without https:// or a path.");
function requireAdmin(role: string) { if (role !== "OWNER" && role !== "ADMIN") redirect("/dashboard/settings?error=Only Owners and Admins can change workspace settings."); }

export async function updateConstructWorkspaceAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireAdmin(context.role);
  const parsed = z.string().trim().min(2).max(100).safeParse(formData.get("name")); if (!parsed.success) redirect("/dashboard/settings?error=Workspace name must be between 2 and 100 characters.");
  const prisma = getConstructPrisma(); await prisma.$transaction([
    prisma.organization.update({ where: { id: context.organizationId }, data: { name: parsed.data } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "settings", action: "workspace_update", recordId: context.organizationId, title: "Workspace identity updated", details: { from: context.organization.name, to: parsed.data } } }),
  ]); revalidatePath("/dashboard", "layout"); redirect("/dashboard/settings?saved=workspace");
}

export async function updateConstructPublicationAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireAdmin(context.role);
  const status = String(formData.get("status") ?? ""); if (status !== "DRAFT" && status !== "PUBLISHED" && status !== "UNPUBLISHED") redirect("/dashboard/settings?error=Invalid publication state.");
  const prisma = getConstructPrisma(); const current = await prisma.sitePublication.findUnique({ where: { organizationId: context.organizationId } });
  await prisma.$transaction([
    prisma.sitePublication.upsert({ where: { organizationId: context.organizationId }, update: { status, publishedAt: status === "PUBLISHED" ? new Date() : current?.publishedAt, publishedById: status === "PUBLISHED" ? context.userId : current?.publishedById }, create: { organizationId: context.organizationId, status, publishedAt: status === "PUBLISHED" ? new Date() : null, publishedById: status === "PUBLISHED" ? context.userId : null } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "publication", action: status.toLowerCase(), recordId: context.organizationId, title: `Website ${status.toLowerCase()}`, details: { from: current?.status ?? null, to: status } } }),
  ]); revalidatePath("/dashboard"); revalidatePath("/", "layout"); redirect("/dashboard/settings?saved=publication");
}

export async function addConstructDomainAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireAdmin(context.role);
  try{await enforceConstructBooleanEntitlement(context.organizationId,"CUSTOM_DOMAIN");}catch(error){redirect(`/dashboard/settings?error=${encodeURIComponent(error instanceof Error?error.message:"Custom domains are unavailable.")}`);}
  const parsed = hostnameSchema.safeParse(formData.get("hostname")); if (!parsed.success) redirect(`/dashboard/settings?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid hostname.")}`);
  if (parsed.data.endsWith(".construct.shaoor-ai.com") || parsed.data === "construct.shaoor-ai.com") redirect("/dashboard/settings?error=Shaoor Construct subdomains are managed by the platform.");
  const prisma = getConstructPrisma();
  try {
    const domain = await prisma.domain.create({ data: { organizationId: context.organizationId, hostname: parsed.data, verificationToken: crypto.randomUUID(), status: "PENDING", isPrimary: false } });
    await prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "domains", action: "add", recordId: domain.id, title: `Domain added: ${domain.hostname}` } });
  } catch { redirect("/dashboard/settings?error=That hostname is already registered."); }
  revalidatePath("/dashboard/settings"); redirect("/dashboard/settings?saved=domain");
}

export async function verifyConstructDomainAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireAdmin(context.role); const id = String(formData.get("id") ?? ""); const prisma = getConstructPrisma();
  const domain = await prisma.domain.findFirst({ where: { id, organizationId: context.organizationId } }); if (!domain) redirect("/dashboard/settings?error=Domain not found.");
  if (domain.hostname.endsWith(".construct.shaoor-ai.com")) redirect("/dashboard/settings?error=The platform subdomain will be activated during deployment.");
  let verified = false;
  try { const records = await resolveTxt(`_shaoor-verify.${domain.hostname}`); verified = records.some(parts => parts.join("") === domain.verificationToken); } catch { verified = false; }
  if (!verified) { await prisma.domain.update({ where: { id }, data: { status: "FAILED" } }); redirect("/dashboard/settings?error=Verification TXT record was not found. DNS changes may take time to propagate."); }
  await prisma.$transaction([
    prisma.domain.update({ where: { id }, data: { status: "ACTIVE", verifiedAt: new Date() } }),
    prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "domains", action: "verify", recordId: id, title: `Domain verified: ${domain.hostname}` } }),
  ]); revalidatePath("/dashboard/settings"); redirect("/dashboard/settings?saved=verified");
}

export async function makeConstructDomainPrimaryAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireAdmin(context.role); const id = String(formData.get("id") ?? ""); const prisma = getConstructPrisma();
  const domain = await prisma.domain.findFirst({ where: { id, organizationId: context.organizationId, status: "ACTIVE" } }); if (!domain) redirect("/dashboard/settings?error=Only a verified active domain can be primary.");
  await prisma.$transaction(async tx => { await tx.domain.updateMany({ where: { organizationId: context.organizationId }, data: { isPrimary: false } }); await tx.domain.update({ where: { id }, data: { isPrimary: true } }); await tx.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "domains", action: "primary", recordId: id, title: `Primary domain changed to ${domain.hostname}` } }); });
  revalidatePath("/dashboard", "layout"); redirect("/dashboard/settings?saved=primary");
}

export async function removeConstructDomainAction(formData: FormData) {
  const context = await requireActiveConstructContext(); requireAdmin(context.role); const id = String(formData.get("id") ?? ""); const prisma = getConstructPrisma();
  const domain = await prisma.domain.findFirst({ where: { id, organizationId: context.organizationId } }); if (!domain) redirect("/dashboard/settings?error=Domain not found.");
  if (domain.isPrimary) redirect("/dashboard/settings?error=Choose another verified primary domain before removing this one.");
  if (domain.hostname === `${context.organization.slug}.construct.shaoor-ai.com`) redirect("/dashboard/settings?error=The workspace subdomain cannot be removed.");
  await prisma.$transaction([prisma.domain.delete({ where: { id } }), prisma.auditLog.create({ data: { organizationId: context.organizationId, actorUserId: context.userId, module: "domains", action: "remove", recordId: id, title: `Domain removed: ${domain.hostname}` } })]);
  revalidatePath("/dashboard/settings"); redirect("/dashboard/settings?saved=domain-removed");
}
