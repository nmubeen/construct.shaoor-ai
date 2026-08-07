"use server";

import path from "path";
import { revalidatePath } from "next/cache";
import { MediaType, Prisma } from "@prisma/client";
import { z } from "zod";

import { logActivity } from "@/lib/actions/audit.actions";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_MEDIA_EXTENSIONS,
  MAX_MEDIA_FILE_SIZE,
  isAllowedExtension,
  normalizeExtension,
  sanitizeFolder,
} from "@/lib/media";
import { deleteUploadedFile } from "@/lib/utils/file";
import { saveMediaFile } from "@/lib/upload/media";

const METADATA_MAX = {
  title: 160,
  altText: 200,
  description: 1000,
  folder: 140,
} as const;

const updateMediaSchema = z.object({
  title: z.string().trim().max(METADATA_MAX.title).nullable(),
  altText: z.string().trim().max(METADATA_MAX.altText).nullable(),
  description: z.string().trim().max(METADATA_MAX.description).nullable(),
  folder: z.string().trim().max(METADATA_MAX.folder).nullable(),
});

export interface GetMediaOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: MediaType | "ALL";
  folder?: string;
  extension?: string;
  sort?: "newest" | "oldest" | "name" | "size";
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value === "" ? null : value;
}

function buildWhere(options: GetMediaOptions): Prisma.MediaWhereInput {
  const search = (options.search ?? "").trim();
  const folder = sanitizeFolder(options.folder);
  const extension = options.extension ? normalizeExtension(options.extension) : "";

  const where: Prisma.MediaWhereInput = {
    isActive: true,
  };

  if (search !== "") {
    where.OR = [
      { fileName: { contains: search } },
      { originalName: { contains: search } },
      { title: { contains: search } },
      { altText: { contains: search } },
      { description: { contains: search } },
      { folder: { contains: search } },
    ];
  }

  if (options.type && options.type !== "ALL") {
    where.type = options.type;
  }

  if (folder) {
    where.folder = folder;
  }

  if (extension) {
    where.extension = extension;
  }

  return where;
}

function sortOrder(sort: GetMediaOptions["sort"]): Prisma.MediaOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "name":
      return [{ originalName: "asc" }];
    case "size":
      return [{ fileSize: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

function pageValue(value?: number) {
  if (!value || Number.isNaN(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function pageSizeValue(value?: number) {
  if (!value || Number.isNaN(value) || value < 1) {
    return 18;
  }

  return Math.min(Math.floor(value), 60);
}

async function createMediaRecord(data: Prisma.MediaUncheckedCreateInput) {
  try {
    return await prisma.media.create({
      data,
    });
  } catch (error) {
    const prismaError = error as { code?: string };

    // Legacy SQLite schemas may still have Media.id as TEXT PRIMARY KEY without
    // an auto-generated default. In that case Prisma throws P2011 for null id.
    if (prismaError.code !== "P2011") {
      throw error;
    }

    const rows = await prisma.$queryRawUnsafe<Array<{ nextId: number | bigint }>>(
      'SELECT COALESCE(MAX(CAST("id" AS INTEGER)), 0) + 1 AS "nextId" FROM "Media"'
    );

    const rawNextId = rows[0]?.nextId ?? 1;
    const nextId = typeof rawNextId === "bigint" ? Number(rawNextId) : Number(rawNextId);

    return prisma.media.create({
      data: {
        ...data,
        id: Number.isFinite(nextId) && nextId > 0 ? nextId : 1,
      },
    });
  }
}

export async function getMedia(options: GetMediaOptions = {}) {
  const page = pageValue(options.page);
  const pageSize = pageSizeValue(options.pageSize);
  const where = buildWhere(options);
  const orderBy = sortOrder(options.sort);

  const [total, items, folders, extensions] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.media.findMany({
      where: { isActive: true },
      distinct: ["folder"],
      select: { folder: true },
      orderBy: { folder: "asc" },
    }),
    prisma.media.findMany({
      where: { isActive: true },
      distinct: ["extension"],
      select: { extension: true },
      orderBy: { extension: "asc" },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    folders: folders.map((item) => item.folder).filter((item): item is string => Boolean(item)),
    extensions: extensions.map((item) => item.extension),
  };
}

export async function getMediaById(id: number) {
  return prisma.media.findUnique({
    where: { id },
  });
}

export async function uploadMedia(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("A file is required.");
  }

  const originalName = file.name?.trim() ?? "";
  if (originalName === "") {
    throw new Error("Invalid filename.");
  }

  if (file.size > MAX_MEDIA_FILE_SIZE) {
    throw new Error("Maximum file size is 20MB.");
  }

  const extension = normalizeExtension(path.extname(originalName));
  if (!isAllowedExtension(extension)) {
    throw new Error(`Unsupported file type. Allowed: ${ALLOWED_MEDIA_EXTENSIONS.join(", ")}.`);
  }

  const folder = sanitizeFolder(text(formData, "folder"));

  const duplicate = await prisma.media.findFirst({
    where: {
      originalName,
      folder,
      isActive: true,
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error("A file with this filename already exists in this folder.");
  }

  const title = optionalText(formData, "title");
  const altText = optionalText(formData, "altText");
  const description = optionalText(formData, "description");

  const saved = await saveMediaFile(file, folder);

  const media = await createMediaRecord({
    fileName: saved.fileName,
    originalName,
    title,
    altText,
    description,
    folder: saved.folder,
    mimeType: saved.mimeType,
    extension: saved.extension,
    fileSize: saved.fileSize,
    width: saved.width,
    height: saved.height,
    type: saved.type,
    url: saved.url,
    thumbnailUrl: saved.thumbnailUrl,
  });

  await logActivity({
    module: "Media",
    action: "CREATE",
    recordId: String(media.id),
    title: `Uploaded Media: ${media.originalName}`,
    details: media.folder ? `Folder: ${media.folder}` : null,
  });

  revalidatePath("/admin/media");

  return media;
}

export async function updateMedia(id: number, formData: FormData) {
  const existing = await prisma.media.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Media item not found.");
  }

  const parsed = updateMediaSchema.safeParse({
    title: optionalText(formData, "title"),
    altText: optionalText(formData, "altText"),
    description: optionalText(formData, "description"),
    folder: optionalText(formData, "folder"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid form values.");
  }

  const folder = sanitizeFolder(parsed.data.folder);

  const updated = await prisma.media.update({
    where: { id },
    data: {
      title: parsed.data.title,
      altText: parsed.data.altText,
      description: parsed.data.description,
      folder,
    },
  });

  await logActivity({
    module: "Media",
    action: "UPDATE",
    recordId: String(updated.id),
    title: `Updated Media: ${updated.originalName}`,
    details: updated.title ? `Title: ${updated.title}` : null,
  });

  revalidatePath("/admin/media");
  revalidatePath(`/admin/media/${id}`);

  return updated;
}

export async function deleteMedia(id: number) {
  const media = await prisma.media.findUnique({
    where: { id },
  });

  if (!media) {
    throw new Error("Media item not found.");
  }

  await prisma.media.delete({
    where: { id },
  });

  await Promise.all([
    deleteUploadedFile(media.url),
    media.thumbnailUrl ? deleteUploadedFile(media.thumbnailUrl) : Promise.resolve(),
  ]);

  await logActivity({
    module: "Media",
    action: "DELETE",
    recordId: String(media.id),
    title: `Deleted Media: ${media.originalName}`,
    details: media.folder ? `Folder: ${media.folder}` : null,
  });

  revalidatePath("/admin/media");
}

export async function searchMedia(
  searchQuery: string,
  options: {
    type?: MediaType | "ALL";
    folder?: string;
    extension?: string;
    limit?: number;
  } = {}
) {
  const where = buildWhere({
    search: searchQuery,
    type: options.type,
    folder: options.folder,
    extension: options.extension,
  });

  return prisma.media.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: Math.min(Math.max(options.limit ?? 24, 1), 60),
  });
}
