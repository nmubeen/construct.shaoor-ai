import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";

import { getConstructPrisma } from "@/lib/construct-prisma";

const ORGANIZATION_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/;

export type ProvisionConstructOrganizationInput = {
  authUser: SupabaseUser;
  organizationName: string;
  organizationSlug: string;
};

export async function provisionConstructOrganization(
  input: ProvisionConstructOrganizationInput,
) {
  const constructPrisma = getConstructPrisma();
  const name = input.organizationName.trim();
  const slug = input.organizationSlug.trim().toLowerCase();
  const email = input.authUser.email?.trim().toLowerCase();

  if (name.length < 2 || name.length > 100) {
    throw new Error("Organization name must be between 2 and 100 characters.");
  }
  if (!ORGANIZATION_SLUG_PATTERN.test(slug)) {
    throw new Error("Organization slug is invalid.");
  }
  if (!email) {
    throw new Error("The authenticated account does not have an email address.");
  }

  const fullName =
    typeof input.authUser.user_metadata.full_name === "string"
      ? input.authUser.user_metadata.full_name.trim() || null
      : null;

  return constructPrisma.$transaction(async (transaction) => {
    const user = await transaction.user.upsert({
      where: { id: input.authUser.id },
      update: { email, fullName },
      create: { id: input.authUser.id, email, fullName },
    });

    const existingMembership = await transaction.membership.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });
    if (existingMembership) {
      throw new Error("This account already has a Construct organization.");
    }

    const organization = await transaction.organization.create({
      data: {
        name,
        slug,
        status: "PENDING",
        memberships: {
          create: { userId: user.id, role: "OWNER" },
        },
        settings: {
          create: {
            companyName: name,
            tagline: "Building with confidence",
            description: `${name} website powered by Shaoor Construct.`,
            phone: "",
            email,
            addressLine1: "",
            city: "",
            country: "India",
            heroTitle: "Spaces built for what comes next",
            heroSubtitle: "Quality construction, delivered with confidence.",
            ctaTitle: "Discuss your next project",
            ctaSubtitle: "Tell us what you are planning and our team will get in touch.",
            ctaButtonText: "Contact us",
            ctaButtonLink: "/contact",
          },
        },
        publication: { create: { status: "DRAFT" } },
        domains: {
          create: {
            hostname: `${slug}.construct.shaoor-ai.com`,
            verificationToken: crypto.randomUUID(),
            status: "PENDING",
            isPrimary: true,
          },
        },
      },
    });

    await transaction.auditLog.create({
      data: {
        organizationId: organization.id,
        actorUserId: user.id,
        module: "organization",
        action: "provision",
        recordId: organization.id,
        title: "Construct organization provisioned",
        details: { slug },
      },
    });

    return organization;
  });
}
