import { clampPercent } from "@/lib/site-config/free-buttons";

export type PlacedPageImage = {
  id: string;
  url: string;
  x: number;
  y: number;
  /** Width as % of page canvas (default 28). */
  width?: number;
  alt?: string;
};

export const DEFAULT_PLACED_IMAGE_WIDTH = 28;

export function normalizePlacedImageWidth(width?: number): number {
  const w = width ?? DEFAULT_PLACED_IMAGE_WIDTH;
  return Math.min(80, Math.max(8, Math.round(w * 10) / 10));
}

function parsePlacedImagesList(
  raw: string | null | undefined,
  options?: { requireUrl?: boolean },
): PlacedPageImage[] {
  const requireUrl = options?.requireUrl ?? true;
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as { images?: PlacedPageImage[] };
    if (!Array.isArray(parsed.images)) return [];
    return parsed.images
      .filter((img) => img && typeof img.id === "string")
      .map((img) => ({
        id: img.id,
        url: String(img.url ?? "").trim(),
        x: clampPercent(Number(img.x) || 50),
        y: clampPercent(Number(img.y) || 50),
        width: normalizePlacedImageWidth(
          img.width !== undefined ? Number(img.width) : undefined,
        ),
        alt: img.alt?.trim() || undefined,
      }))
      .filter((img) => !requireUrl || img.url.length > 0);
  } catch {
    return [];
  }
}

/** Published / live pages — images without a URL are omitted. */
export function parsePlacedImages(raw: string | null | undefined): PlacedPageImage[] {
  return parsePlacedImagesList(raw, { requireUrl: true });
}

/** Editor draft — keeps placeholders until a URL is set. */
export function parsePlacedImagesDraft(
  raw: string | null | undefined,
): PlacedPageImage[] {
  return parsePlacedImagesList(raw, { requireUrl: false });
}

export function serializePlacedImages(images: PlacedPageImage[]): string {
  return JSON.stringify(
    {
      images: images.map((img) => ({
        id: img.id,
        url: img.url.trim(),
        x: clampPercent(img.x),
        y: clampPercent(img.y),
        width: normalizePlacedImageWidth(img.width),
        alt: img.alt?.trim() || undefined,
      })),
    },
    null,
    2,
  );
}

export function placedImagesEqual(
  a: PlacedPageImage[],
  b: PlacedPageImage[],
): boolean {
  return serializePlacedImages(a) === serializePlacedImages(b);
}
