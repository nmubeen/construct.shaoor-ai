import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { buildProgressPhotoStoragePath, signProgressPhotos, stripProgressPhotoMetadata } from "@/lib/services/construct-progress-media.service";

describe("buildProgressPhotoStoragePath", () => {
  it("scopes the path by organization and update id, with a random prefix and a sanitized filename", () => {
    const path = buildProgressPhotoStoragePath("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222", "My Photo (1).JPG");
    expect(path.startsWith("11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/")).toBe(true);
    expect(path).toMatch(/my-photo-1-\.jpg$|my-photo-1\.jpg$/i);
    expect(path).not.toContain(" ");
    expect(path).not.toContain("(");
  });

  it("falls back to a safe default name for a filename with no usable characters", () => {
    const path = buildProgressPhotoStoragePath("org", "update", "★★★.jpg");
    expect(path.endsWith(".jpg")).toBe(true);
  });

  it("never reuses a path for two different uploads of the same original filename", () => {
    const a = buildProgressPhotoStoragePath("org", "update", "same-name.jpg");
    const b = buildProgressPhotoStoragePath("org", "update", "same-name.jpg");
    expect(a).not.toBe(b);
  });
});

describe("stripProgressPhotoMetadata", () => {
  it("removes EXIF metadata from the output even when the input has it", async () => {
    const withExif = await sharp({ create: { width: 20, height: 20, channels: 3, background: { r: 100, g: 120, b: 140 } } })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: "PROGRESS_TEST_EXIF_MARKER" } } })
      .toBuffer();

    const inputMeta = await sharp(withExif).metadata();
    expect(inputMeta.exif).toBeTruthy(); // sanity check: the fixture really has EXIF before stripping

    const result = await stripProgressPhotoMetadata(withExif);
    const outputMeta = await sharp(result.buffer).metadata();
    expect(outputMeta.exif).toBeUndefined();
  });

  it("returns width/height read from the actual image content", async () => {
    const buffer = await sharp({ create: { width: 64, height: 32, channels: 3, background: { r: 0, g: 0, b: 0 } } }).jpeg().toBuffer();
    const result = await stripProgressPhotoMetadata(buffer);
    expect(result.width).toBe(64);
    expect(result.height).toBe(32);
  });

  it("throws on a corrupt/non-image buffer (also serves as upload-time file-integrity validation)", async () => {
    await expect(stripProgressPhotoMetadata(Buffer.from("not a real image"))).rejects.toThrow();
  });
});

describe("signProgressPhotos", () => {
  it("passes a PUBLIC_REFERENCE photo's URL through unchanged, with no storage call", async () => {
    const result = await signProgressPhotos([{ id: "p1", storagePath: null, publicImageUrl: "https://example.test/public/already-public.jpg", caption: "A caption" }]);
    expect(result).toEqual([{ id: "p1", url: "https://example.test/public/already-public.jpg", caption: "A caption" }]);
  });

  it("omits (rather than throws for) a PRIVATE_UPLOAD photo whose storage object doesn't exist — fails closed per photo, not per page", async () => {
    const result = await signProgressPhotos([{ id: "p2", storagePath: "nonexistent-org/nonexistent-update/nonexistent-file.jpg", publicImageUrl: null, caption: null }]);
    expect(result).toEqual([]);
  });

  it("returns an empty array for an empty input without making any storage call", async () => {
    expect(await signProgressPhotos([])).toEqual([]);
  });
});
