import { BUTTON_PLACEMENTS } from "@/lib/site-config/types";
import { clampPercent } from "@/lib/site-config/free-buttons";

export const BB_BUTTON_DRAG_MIME = "application/x-bb-button";

export type ButtonDragPayload =
  | { kind: "new" }
  | { kind: "move"; buttonId: string };

export function getPlacementLabel(placementId: string): string {
  return (
    BUTTON_PLACEMENTS.find((p) => p.id === placementId)?.label ?? placementId
  );
}

export function encodeButtonDragPayload(payload: ButtonDragPayload): string {
  return JSON.stringify(payload);
}

export function parseButtonDragPayload(raw: string): ButtonDragPayload | null {
  try {
    const data = JSON.parse(raw) as ButtonDragPayload;
    if (data.kind === "new") return { kind: "new" };
    if (data.kind === "move" && typeof data.buttonId === "string") {
      return { kind: "move", buttonId: data.buttonId };
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeCanvasPosition(x: number, y: number) {
  return { x: clampPercent(x), y: clampPercent(y) };
}
