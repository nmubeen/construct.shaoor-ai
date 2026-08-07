import type { MediaType } from "@prisma/client";

export const MAX_MEDIA_FILE_SIZE = 20 * 1024 * 1024;

export const ALLOWED_MEDIA_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "svg",
  "webp",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "zip",
] as const;

export type AllowedMediaExtension = (typeof ALLOWED_MEDIA_EXTENSIONS)[number];

export const IMAGE_EXTENSIONS = new Set<AllowedMediaExtension>([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "svg",
  "webp",
]);

export const VIDEO_EXTENSIONS = new Set<string>(["mp4", "webm", "mov", "avi", "mkv"]);

export const DOCUMENT_EXTENSIONS = new Set<AllowedMediaExtension>([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
]);

export function normalizeExtension(value: string) {
  return value.replace(/^\./, "").trim().toLowerCase();
}

export function isAllowedExtension(extension: string): extension is AllowedMediaExtension {
  return ALLOWED_MEDIA_EXTENSIONS.includes(normalizeExtension(extension) as AllowedMediaExtension);
}

export function detectMediaType(extension: string, mimeType: string): MediaType {
  const ext = normalizeExtension(extension);

  if (IMAGE_EXTENSIONS.has(ext as AllowedMediaExtension) || mimeType.startsWith("image/")) {
    return "IMAGE";
  }

  if (mimeType.startsWith("video/") || VIDEO_EXTENSIONS.has(ext)) {
    return "VIDEO";
  }

  if (DOCUMENT_EXTENSIONS.has(ext as AllowedMediaExtension)) {
    return "DOCUMENT";
  }

  return "OTHER";
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }

  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export function sanitizeFolder(value: string | null | undefined) {
  const input = (value ?? "").trim();
  if (input === "") {
    return null;
  }

  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9\-_/\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");

  return cleaned === "" ? null : cleaned;
}

export function buildMediaAcceptList() {
  return ALLOWED_MEDIA_EXTENSIONS.map((ext) => `.${ext}`).join(",");
}
