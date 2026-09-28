/**
 * Validates and normalises uploaded images (server-only).
 * Images are decoded and re-encoded with sharp, which:
 *  - rejects anything that is not a real image,
 *  - applies EXIF orientation, then strips ALL metadata (including GPS
 *    location and camera details — important for anonymous reports),
 *  - limits the size to keep the database small.
 */
import sharp from "sharp";
import { badRequest } from "./http";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["jpeg", "png", "webp", "gif", "heif", "avif"]);

export async function processImage(file: File, maxDim: number) {
  if (file.size === 0) throw badRequest("invalid_image", "The image is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw badRequest("image_too_large", "Images must be 8 MB or smaller.");
  const input = Buffer.from(await file.arrayBuffer());
  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    throw badRequest("invalid_image", "That file is not a supported image.");
  }
  if (!format || !ALLOWED.has(format)) throw badRequest("invalid_image", "Please upload a JPG, PNG or WebP image.");
  const data = await sharp(input, { failOn: "error" })
    .rotate()
    .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return { data, mime: "image/jpeg", size: data.length };
}
