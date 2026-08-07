"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/actions/audit.actions";
import { deleteFileIfOrphaned } from "@/lib/actions/helpers/media-file.helpers";
import { ensureClientTableIsCompatible } from "@/lib/actions/client-repair";

import {
  stringValue,
  optionalValue,
  numberValue,
  booleanValue,
} from "@/lib/actions/helpers/form.helpers";

function clientDataFromForm(formData: FormData) {
  return {
    name: stringValue(formData, "name"),
    slug: stringValue(formData, "slug"),
    logo: optionalValue(formData, "logo"),
    website: optionalValue(formData, "website"),
    category: optionalValue(formData, "category"),
    description: optionalValue(formData, "description"),
    displayOrder: numberValue(formData, "displayOrder"),
    featured: booleanValue(formData, "featured"),
    active: booleanValue(formData, "active"),
  };
}

export async function createClient(formData: FormData) {
  await ensureClientTableIsCompatible();

  const data = clientDataFromForm(formData);

  await prisma.$executeRaw`
    INSERT INTO "Client" (
      "name",
      "slug",
      "logo",
      "website",
      "category",
      "description",
      "displayOrder",
      "featured",
      "active",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${data.name},
      ${data.slug},
      ${data.logo ?? null},
      ${data.website ?? null},
      ${data.category ?? null},
      ${data.description ?? null},
      ${data.displayOrder},
      ${data.featured ? 1 : 0},
      ${data.active ? 1 : 0},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
  `;

  const client = await prisma.client.findUnique({
    where: {
      slug: data.slug,
    },
  });

  if (!client) {
    throw new Error("Client creation failed.");
  }

  await logActivity({
    module: "Clients",
    action: "CREATE",
    recordId: String(client.id),
    title: `Created Client: ${client.name}`,
    details: `Slug: ${client.slug}`,
  });

  revalidatePath("/admin/clients");
  revalidatePath("/clients");

}

export async function updateClient(
  id: number,
  formData: FormData
) {
  const existingClient = await prisma.client.findUnique({
    where: {
      id,
    },
  });

  if (!existingClient) {
    throw new Error("Client not found.");
  }

  const data = clientDataFromForm(formData);

  const previousLogo = existingClient.logo;

  const updatedClient = await prisma.client.update({
    where: {
      id,
    },
    data,
  });

  if (
    previousLogo &&
    updatedClient.logo !== previousLogo
  ) {
    await deleteFileIfOrphaned(previousLogo);
  }

  await logActivity({
    module: "Clients",
    action: "UPDATE",
    recordId: String(updatedClient.id),
    title: `Updated Client: ${updatedClient.name}`,
    details: `Slug: ${updatedClient.slug}`,
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  revalidatePath("/clients");

}

export async function deleteClient(id: number) {
  const client = await prisma.client.findUnique({
    where: {
      id,
    },
  });

  if (!client) {
    throw new Error("Client not found.");
  }

  await prisma.client.delete({
    where: {
      id,
    },
  });

  if (client.logo) {
    await deleteFileIfOrphaned(client.logo);
  }

  await logActivity({
    module: "Clients",
    action: "DELETE",
    recordId: String(client.id),
    title: `Deleted Client: ${client.name}`,
    details: `Slug: ${client.slug}`,
  });

  revalidatePath("/admin/clients");
  revalidatePath("/clients");

}

export async function getClients() {
  return prisma.client.findMany({
    orderBy: [
      {
        displayOrder: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function getClient(id: number) {
  return prisma.client.findUnique({
    where: {
      id,
    },
  });
}

export async function getClientBySlug(slug: string) {
  return prisma.client.findUnique({
    where: {
      slug,
    },
  });
}
