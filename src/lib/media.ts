import { prisma } from "@/lib/db";

export const MEDIA_MAX_BYTES = 3 * 1024 * 1024;
export const MEDIA_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const FILENAME_RE = /^[A-Za-z0-9._-]+$/;

export class MediaUploadError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function isSafeMediaFilename(filename: string): boolean {
  return FILENAME_RE.test(filename);
}

function extensionFor(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    return ext.replace("jpeg", "jpg");
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export async function saveUploadedImage(
  file: File,
  prefix = "",
): Promise<{ url: string; filename: string }> {
  if (!MEDIA_ALLOWED_TYPES.has(file.type)) {
    throw new MediaUploadError(
      "Only JPEG, PNG, WebP, and GIF images are allowed",
      400,
    );
  }

  if (file.size > MEDIA_MAX_BYTES) {
    throw new MediaUploadError("Image must be 3 MB or smaller", 400);
  }

  const filename = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extensionFor(file)}`;
  const data = Buffer.from(await file.arrayBuffer());

  await prisma.mediaFile.create({
    data: {
      filename,
      mimeType: file.type || "image/jpeg",
      data,
    },
  });

  return { url: `/uploads/${filename}`, filename };
}

export async function getUploadedImage(filename: string) {
  if (!isSafeMediaFilename(filename)) return null;
  return prisma.mediaFile.findUnique({
    where: { filename },
    select: { data: true, mimeType: true },
  });
}
