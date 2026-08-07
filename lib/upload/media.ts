import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

import {
  detectMediaType,
  normalizeExtension,
  sanitizeFolder,
} from "@/lib/media";

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
};

function toPublicUrl(...parts: string[]) {
  return `/${parts.join("/").replace(/\\/g, "/")}`;
}

function removeLeadingSlash(input: string) {
  return input.replace(/^\/+/, "");
}

async function ensureDirectory(directory: string) {
  await fs.mkdir(directory, { recursive: true });
}

export interface SavedMediaFile {
  fileName: string;
  mimeType: string;
  extension: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  type: ReturnType<typeof detectMediaType>;
  folder: string | null;
  url: string;
  thumbnailUrl: string | null;
}

export async function saveMediaFile(file: File, folderInput?: string | null): Promise<SavedMediaFile> {
  const originalName = file.name || "file";
  const extension = normalizeExtension(path.extname(originalName));
  const mimeType = file.type || MIME_BY_EXTENSION[extension] || "application/octet-stream";
  const folder = sanitizeFolder(folderInput);

  const uniqueName = `${Date.now()}-${randomUUID()}.${extension}`;

  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const destinationDir = folder
    ? path.join(uploadsRoot, removeLeadingSlash(folder))
    : uploadsRoot;

  await ensureDirectory(destinationDir);

  const destinationPath = path.join(destinationDir, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(destinationPath, buffer);

  const type = detectMediaType(extension, mimeType);

  let width: number | null = null;
  let height: number | null = null;
  let thumbnailUrl: string | null = null;

  if (type === "IMAGE") {
    try {
      const image = sharp(buffer, { animated: true }).rotate();
      const metadata = await image.metadata();

      width = metadata.width ?? null;
      height = metadata.height ?? null;

      const thumbnailsRoot = path.join(uploadsRoot, "thumbnails");
      const thumbnailDir = folder
        ? path.join(thumbnailsRoot, removeLeadingSlash(folder))
        : thumbnailsRoot;

      await ensureDirectory(thumbnailDir);

      const thumbnailName = `${path.parse(uniqueName).name}-thumb.webp`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailName);

      await image
        .resize({
          width: 480,
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);

      thumbnailUrl = folder
        ? toPublicUrl("uploads", "thumbnails", removeLeadingSlash(folder), thumbnailName)
        : toPublicUrl("uploads", "thumbnails", thumbnailName);
    } catch {
      width = null;
      height = null;
      thumbnailUrl = null;
    }
  }

  const url = folder
    ? toPublicUrl("uploads", removeLeadingSlash(folder), uniqueName)
    : toPublicUrl("uploads", uniqueName);

  return {
    fileName: uniqueName,
    mimeType,
    extension,
    fileSize: file.size,
    width,
    height,
    type,
    folder,
    url,
    thumbnailUrl,
  };
}
