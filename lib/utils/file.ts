import fs from "fs/promises";
import path from "path";

export async function deleteUploadedFile(imagePath: string) {
  if (
    !imagePath ||
    imagePath.startsWith("/images/")
  ) {
    return;
  }

  try {
    const relativePath = imagePath
      .replace(/^\/+/, "")
      .replace(/\\/g, "/");

    const fullPath = path.join(
      process.cwd(),
      "public",
      relativePath
    );

    await fs.unlink(fullPath);
  } catch {
    // Ignore if file doesn't exist
  }
}