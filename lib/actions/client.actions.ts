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

  const client = await prisma.client.create({ data });

  await logActivity({
    module: "Clients",
    action: "CREATE",
    recordId: String(client.id),
    title: `Created Client: ${client.name}`,
    details: `Slug: ${client.slug}`,
  });

  revalidatePath("/admin/clients");
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function updateClient(id: number, formData: FormData) {
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

  if (previousLogo && updatedClient.logo !== previousLogo) {
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
  revalidatePath("/");
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
  revalidatePath("/");
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
  return prisma.client.findFirst({
    where: {
      id,
    },
  });
}

export async function getClientBySlug(slug: string) {
  return prisma.client.findFirst({
    where: {
      slug,
    },
  });
}
