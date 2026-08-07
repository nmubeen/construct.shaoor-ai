"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logActivity } from "@/lib/actions/audit.actions";
import { prisma } from "@/lib/prisma";
import { deleteFileIfOrphaned } from "@/lib/actions/helpers/media-file.helpers";

const gallerySchema = z.object({
  title: z.string().trim().min(1, "Gallery name is required."),
  slug: z.string().trim().min(1, "Slug is required."),
  description: z.string().trim().nullable(),
  coverImage: z.string().trim().nullable(),
  featured: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().min(0).default(0),
});

type OrderedGalleryItem = {
  id: number;
  sortOrder: number;
  caption?: string | null;
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value === "" ? null : value;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function parseSortOrder(formData: FormData, key: string) {
  const value = Number(formData.get(key) ?? 0);
  if (Number.isNaN(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

function parseCreateMediaItems(formData: FormData) {
  const mediaIds = formData
    .getAll("mediaIds")
    .map((value) => Number(String(value).trim()))
    .filter((value) => !Number.isNaN(value) && value > 0);

  const captions = formData
    .getAll("mediaCaptions")
    .map((value) => String(value).trim());

  return mediaIds.map((mediaId, index) => ({
    mediaId,
    caption: captions[index] ? captions[index] : null,
    sortOrder: index,
  }));
}

function revalidateGalleryPaths(galleryId?: number) {
  revalidatePath("/admin/gallery");

  if (galleryId) {
    revalidatePath(`/admin/gallery/${galleryId}`);
  }
}

export async function getGalleries() {
  return prisma.gallery.findMany({
    include: {
      _count: {
        select: { items: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getGallery(id: number) {
  return prisma.gallery.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          media: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}

export async function createGallery(formData: FormData) {
  const parsed = gallerySchema.safeParse({
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    description: optionalText(formData, "description"),
    coverImage: optionalText(formData, "coverImage"),
    featured: bool(formData, "featured"),
    isActive: bool(formData, "isActive"),
    sortOrder: parseSortOrder(formData, "sortOrder"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid gallery form values.");
  }

  const slugTaken = await prisma.gallery.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });

  if (slugTaken) {
    throw new Error("A gallery with this slug already exists.");
  }

  const items = parseCreateMediaItems(formData);

  if (items.length === 0) {
    throw new Error("Add at least one image to the gallery.");
  }

  const mediaCount = await prisma.media.count({
    where: {
      id: {
        in: items.map((item) => item.mediaId),
      },
      type: "IMAGE",
      isActive: true,
    },
  });

  if (mediaCount !== items.length) {
    throw new Error("One or more selected media items are invalid.");
  }

  const gallery = await prisma.gallery.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      coverImage: parsed.data.coverImage,
      featured: parsed.data.featured,
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
      items: {
        create: items,
      },
    },
  });

  await logActivity({
    module: "Gallery",
    action: "CREATE",
    recordId: String(gallery.id),
    title: `Created Gallery: ${gallery.title}`,
    details: `Slug: ${gallery.slug}`,
  });

  revalidateGalleryPaths(gallery.id);

  return gallery;
}

export async function updateGallery(id: number, formData: FormData) {
  const existing = await prisma.gallery.findUnique({
    where: { id },
    select: { id: true, slug: true, coverImage: true },
  });

  if (!existing) {
    throw new Error("Gallery not found.");
  }

  const parsed = gallerySchema.safeParse({
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    description: optionalText(formData, "description"),
    coverImage: optionalText(formData, "coverImage"),
    featured: bool(formData, "featured"),
    isActive: bool(formData, "isActive"),
    sortOrder: parseSortOrder(formData, "sortOrder"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid gallery form values.");
  }

  const slugTaken = await prisma.gallery.findFirst({
    where: {
      slug: parsed.data.slug,
      NOT: { id },
    },
    select: { id: true },
  });

  if (slugTaken) {
    throw new Error("A gallery with this slug already exists.");
  }

  const count = await prisma.galleryItem.count({
    where: { galleryId: id },
  });

  if (count === 0) {
    throw new Error("Add at least one image to the gallery.");
  }

  const updated = await prisma.gallery.update({
    where: { id },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      coverImage: parsed.data.coverImage,
      featured: parsed.data.featured,
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
    },
  });

  if (existing.coverImage && existing.coverImage !== updated.coverImage) {
    await deleteFileIfOrphaned(existing.coverImage);
  }

  await logActivity({
    module: "Gallery",
    action: "UPDATE",
    recordId: String(updated.id),
    title: `Updated Gallery: ${updated.title}`,
    details: `Slug: ${updated.slug}`,
  });

  revalidateGalleryPaths(id);
}

export async function deleteGallery(id: number) {
  const gallery = await prisma.gallery.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      coverImage: true,
    },
  });

  if (!gallery) {
    throw new Error("Gallery not found.");
  }

  await prisma.gallery.delete({
    where: { id },
  });

  if (gallery.coverImage) {
    await deleteFileIfOrphaned(gallery.coverImage);
  }

  await logActivity({
    module: "Gallery",
    action: "DELETE",
    recordId: String(gallery.id),
    title: `Deleted Gallery: ${gallery.title}`,
    details: null,
  });

  revalidateGalleryPaths();
}

export async function addGalleryMedia(galleryId: number, mediaIds: number[]) {
  const normalizedIds = mediaIds
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id) && id > 0);

  if (normalizedIds.length === 0) {
    throw new Error("Select at least one image.");
  }

  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: { id: true },
  });

  if (!gallery) {
    throw new Error("Gallery not found.");
  }

  const media = await prisma.media.findMany({
    where: {
      id: { in: normalizedIds },
      type: "IMAGE",
      isActive: true,
    },
    select: { id: true },
  });

  if (media.length !== normalizedIds.length) {
    throw new Error("One or more selected images are invalid.");
  }

  const [existingItems, latestItem] = await Promise.all([
    prisma.galleryItem.findMany({
      where: {
        galleryId,
      },
      select: {
        mediaId: true,
      },
    }),
    prisma.galleryItem.findFirst({
      where: { galleryId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    }),
  ]);

  const existingMedia = new Set(existingItems.map((item) => item.mediaId));
  let nextSortOrder = (latestItem?.sortOrder ?? -1) + 1;

  const toCreate = normalizedIds
    .filter((mediaId) => !existingMedia.has(mediaId))
    .map((mediaId) => ({
      galleryId,
      mediaId,
      sortOrder: nextSortOrder++,
    }));

  if (toCreate.length > 0) {
    await prisma.galleryItem.createMany({
      data: toCreate,
    });
  }

  revalidateGalleryPaths(galleryId);
}

export async function removeGalleryMedia(itemId: number) {
  const item = await prisma.galleryItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      galleryId: true,
    },
  });

  if (!item) {
    throw new Error("Gallery image not found.");
  }

  const totalItems = await prisma.galleryItem.count({
    where: { galleryId: item.galleryId },
  });

  if (totalItems <= 1) {
    throw new Error("A gallery must have at least one image.");
  }

  await prisma.galleryItem.delete({
    where: { id: item.id },
  });

  const remaining = await prisma.galleryItem.findMany({
    where: { galleryId: item.galleryId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  await Promise.all(
    remaining.map((entry, index) =>
      prisma.galleryItem.update({
        where: { id: entry.id },
        data: { sortOrder: index },
      })
    )
  );

  revalidateGalleryPaths(item.galleryId);
}

export async function updateGalleryOrder(galleryId: number, items: OrderedGalleryItem[]) {
  if (items.length === 0) {
    throw new Error("A gallery must have at least one image.");
  }

  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: { id: true },
  });

  if (!gallery) {
    throw new Error("Gallery not found.");
  }

  const existing = await prisma.galleryItem.findMany({
    where: { galleryId },
    select: { id: true },
  });

  const existingIds = new Set(existing.map((item) => item.id));

  for (const item of items) {
    if (!existingIds.has(item.id)) {
      throw new Error("Invalid gallery item detected.");
    }
  }

  await prisma.$transaction(
    items.map((item, index) =>
      prisma.galleryItem.update({
        where: { id: item.id },
        data: {
          sortOrder: index,
          caption: item.caption?.trim() ? item.caption.trim() : null,
        },
      })
    )
  );

  revalidateGalleryPaths(galleryId);
}

export async function getActiveGalleries() {
  return prisma.gallery.findMany({
    where: {
      isActive: true,
    },
    include: {
      items: {
        include: {
          media: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getActiveGalleryBySlug(slug: string) {
  return prisma.gallery.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      items: {
        include: {
          media: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}