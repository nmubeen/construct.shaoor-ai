import "server-only";

import sharp from "sharp";

import { getConstructServiceSupabase } from "@/lib/supabase/service";

export const PROGRESS_BUCKET = "construct-progress-media";
export const MAX_PROGRESS_PHOTO_SIZE = 10 * 1024 * 1024; // matches construct-media's existing limit
export const ALLOWED_PROGRESS_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

// Short-lived on purpose (see the product spec: "keep signed URL
// lifetimes short and document that an already-issued URL may remain
// valid briefly until it expires"). 10 minutes is enough to render a
// page and let a browser finish fetching every image on a slow mobile
// connection, without leaving a link usable for long after a revoke —
// a revoke stops NEW signed URLs from being issued immediately; any
// URL already handed to a browser can still be used until it expires.
export const SIGNED_PHOTO_URL_TTL_SECONDS = 10 * 60;

function safeSegment(value: string, fallback: string) {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return cleaned || fallback;
}

// Org- and update-scoped path, matching construct-media's convention
// (organizationId/.../uuid-filename) so the same "never trust a
// client-provided path" discipline applies: every caller builds this
// itself from server-resolved ids, never from client input.
export function buildProgressPhotoStoragePath(organizationId: string, updateId: string, originalFileName: string): string {
  const fileName = safeSegment(originalFileName.slice(0, 255), "photo");
  return `${organizationId}/${updateId}/${crypto.randomUUID()}-${fileName}`;
}

// Re-encodes through sharp (auto-orients from the original EXIF
// Orientation tag via .rotate() with no argument, then strips all
// metadata by never calling .withMetadata()) — sharp strips metadata by
// default on encode, so simply piping through toBuffer() without
// .withMetadata() is what actually removes GPS/device EXIF data. This
// is a deliberate improvement over the existing construct-media route,
// which uploads the raw buffer untouched and currently preserves
// metadata — not something to copy for site photos that may carry GPS
// tags from a phone camera. Also serves as file-integrity validation,
// same as the existing route's sharp.metadata() call: a corrupt/invalid
// image throws here before anything is uploaded.
export async function stripProgressPhotoMetadata(buffer: Buffer): Promise<{ buffer: Buffer; width: number | null; height: number | null }> {
  const image = sharp(buffer).rotate();
  const output = await image.toBuffer({ resolveWithObject: true });
  return { buffer: output.data, width: output.info.width ?? null, height: output.info.height ?? null };
}

export async function uploadProgressPhoto(storagePath: string, buffer: Buffer, contentType: string): Promise<{ error?: string }> {
  const supabase = getConstructServiceSupabase();
  const { error } = await supabase.storage.from(PROGRESS_BUCKET).upload(storagePath, buffer, { contentType, upsert: false });
  return error ? { error: error.message } : {};
}

export async function deleteProgressPhotoObjects(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return;
  const supabase = getConstructServiceSupabase();
  await supabase.storage.from(PROGRESS_BUCKET).remove(storagePaths);
}

export type SignablePhoto = { id: string; storagePath: string | null; publicImageUrl: string | null; caption: string | null };
export type SignedPhoto = { id: string; url: string; caption: string | null };

// Issues a fresh signed URL for every PRIVATE_UPLOAD photo (and passes
// a PUBLIC_REFERENCE photo's already-public URL through unchanged) —
// called from both the public customer route (after validating the
// bearer token/expiry/revocation/entitlement/organization status) and
// the authenticated staff preview route (after the normal dashboard
// auth+role+entitlement checks) — same signing call either way, just
// gated by different upstream checks. A photo whose signed-URL request
// fails is omitted rather than crashing the whole page (fails closed on
// a per-photo basis, not per-page).
export async function signProgressPhotos(photos: SignablePhoto[]): Promise<SignedPhoto[]> {
  if (photos.length === 0) return [];
  const supabase = getConstructServiceSupabase();
  const signed = await Promise.all(
    photos.map(async (photo): Promise<SignedPhoto | null> => {
      if (photo.publicImageUrl) return { id: photo.id, url: photo.publicImageUrl, caption: photo.caption };
      if (!photo.storagePath) return null;
      const { data, error } = await supabase.storage.from(PROGRESS_BUCKET).createSignedUrl(photo.storagePath, SIGNED_PHOTO_URL_TTL_SECONDS);
      if (error || !data) return null;
      return { id: photo.id, url: data.signedUrl, caption: photo.caption };
    }),
  );
  return signed.filter((p): p is SignedPhoto => p !== null);
}
