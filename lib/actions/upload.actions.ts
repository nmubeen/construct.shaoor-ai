"use server";

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { v4 as uuid } from "uuid";

const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function uploadProjectImage(
  file: File
): Promise<string> {
  if (!file) {
    throw new Error("No file selected.");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      "Only JPG, PNG and WEBP images are supported."
    );
  }

  if (file.size > MAX_SIZE) {
    throw new Error(
      "Maximum file size is 5MB."
    );
  }

  const bytes = await file.arrayBuffer();

  const buffer = Buffer.from(bytes);

  const filename =
    `${Date.now()}-${uuid()}.webp`;

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "projects"
  );

  await fs.mkdir(uploadDir, {
    recursive: true,
  });

  const destination = path.join(
    uploadDir,
    filename
  );

  await sharp(buffer)
    .rotate()
    .resize({
      width: 1600,
      withoutEnlargement: true,
    })
    .webp({
      quality: 85,
    })
    .toFile(destination);

  return `/uploads/projects/${filename}`;
}