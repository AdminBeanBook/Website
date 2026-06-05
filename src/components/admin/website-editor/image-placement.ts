import { clampPercent } from "@/lib/site-config/free-buttons";

export const BB_IMAGE_DRAG_MIME = "application/x-bb-placed-image";

export type ImageDragPayload =
  | { kind: "new" }
  | { kind: "move"; imageId: string };

export function encodeImageDragPayload(payload: ImageDragPayload): string {
  return JSON.stringify(payload);
}

export function parseImageDragPayload(raw: string): ImageDragPayload | null {
  try {
    const data = JSON.parse(raw) as ImageDragPayload;
    if (data.kind === "new") return { kind: "new" };
    if (data.kind === "move" && typeof data.imageId === "string") {
      return { kind: "move", imageId: data.imageId };
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeCanvasPosition(x: number, y: number) {
  return { x: clampPercent(x), y: clampPercent(y) };
}
