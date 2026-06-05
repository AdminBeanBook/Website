"use client";

import { useEffect, useRef, useState } from "react";
import {
  BB_BUTTON_DRAG_MIME,
  normalizeCanvasPosition as normalizeButtonPosition,
  parseButtonDragPayload,
  type ButtonDragPayload,
} from "@/components/admin/website-editor/button-placement";
import {
  BB_IMAGE_DRAG_MIME,
  normalizeCanvasPosition as normalizeImagePosition,
  parseImageDragPayload,
  type ImageDragPayload,
} from "@/components/admin/website-editor/image-placement";
import { usePageCanvasRect } from "@/components/admin/website-editor/usePageCanvasRect";
import type { PlacedPageImage } from "@/lib/pages/placed-images";
import { DEFAULT_PLACED_IMAGE_WIDTH } from "@/lib/pages/placed-images";

export type EditorCanvasButton = {
  id: string;
  label: string;
  x: number;
  y: number;
  style: "primary" | "outline";
};

const CANVAS_DRAG_START = "bb-canvas-drag-start";
const CANVAS_DRAG_END = "bb-canvas-drag-end";

export function dispatchCanvasDragStart() {
  document.dispatchEvent(new CustomEvent(CANVAS_DRAG_START));
}

export function dispatchCanvasDragEnd() {
  document.dispatchEvent(new CustomEvent(CANVAS_DRAG_END));
}

/** @deprecated Use dispatchCanvasDragStart */
export function dispatchButtonDragStart() {
  dispatchCanvasDragStart();
}

/** @deprecated Use dispatchCanvasDragEnd */
export function dispatchButtonDragEnd() {
  dispatchCanvasDragEnd();
}

type EditorPreviewFrameProps = {
  previewPath: string;
  previewKey: number;
  buttonEditEnabled: boolean;
  canvasButtons: EditorCanvasButton[];
  onCanvasPosition: (
    position: { x: number; y: number },
    payload: ButtonDragPayload,
  ) => void;
  imageEditEnabled?: boolean;
  canvasImages?: PlacedPageImage[];
  onImageCanvasPosition?: (
    position: { x: number; y: number },
    payload: ImageDragPayload,
  ) => void;
};

export function EditorPreviewFrame({
  previewPath,
  previewKey,
  buttonEditEnabled,
  canvasButtons,
  onCanvasPosition,
  imageEditEnabled = false,
  canvasImages = [],
  onImageCanvasPosition,
}: EditorPreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragging, setDragging] = useState<{
    kind: "button" | "image";
    id: string;
  } | null>(null);
  const [livePos, setLivePos] = useState<{ x: number; y: number } | null>(null);

  const canvasEditEnabled = buttonEditEnabled || imageEditEnabled;

  const { canvasRect, clientToPercent, percentToOverlayStyle } = usePageCanvasRect(
    iframeRef,
    canvasEditEnabled,
    previewKey,
  );

  useEffect(() => {
    if (!canvasEditEnabled) return;
    const onStart = () => setDragActive(true);
    const onEnd = () => {
      setDragActive(false);
      setDragging(null);
      setLivePos(null);
    };
    document.addEventListener(CANVAS_DRAG_START, onStart);
    document.addEventListener(CANVAS_DRAG_END, onEnd);
    window.addEventListener("dragend", onEnd);
    return () => {
      document.removeEventListener(CANVAS_DRAG_START, onStart);
      document.removeEventListener(CANVAS_DRAG_END, onEnd);
      window.removeEventListener("dragend", onEnd);
    };
  }, [canvasEditEnabled]);

  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const pos = clientToPercent(e.clientX, e.clientY);
    if (!pos) return;

    const buttonRaw = e.dataTransfer.getData(BB_BUTTON_DRAG_MIME);
    const buttonPayload = parseButtonDragPayload(buttonRaw);
    if (buttonPayload && buttonEditEnabled) {
      onCanvasPosition(normalizeButtonPosition(pos.x, pos.y), buttonPayload);
      return;
    }

    const imageRaw = e.dataTransfer.getData(BB_IMAGE_DRAG_MIME);
    const imagePayload = parseImageDragPayload(imageRaw);
    if (imagePayload && imageEditEnabled && onImageCanvasPosition) {
      onImageCanvasPosition(normalizeImagePosition(pos.x, pos.y), imagePayload);
    }
  }

  function handleCanvasDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const pos = clientToPercent(e.clientX, e.clientY);
    if (pos) {
      const norm = buttonEditEnabled
        ? normalizeButtonPosition(pos.x, pos.y)
        : normalizeImagePosition(pos.x, pos.y);
      setLivePos(norm);
    }
  }

  function startPointerDrag(
    kind: "button" | "image",
    id: string,
    onMove: (position: { x: number; y: number }) => void,
    e: React.PointerEvent,
  ) {
    if (!canvasEditEnabled || !canvasRect) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging({ kind, id });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const onPointerMove = (ev: PointerEvent) => {
      const pos = clientToPercent(ev.clientX, ev.clientY);
      if (pos) {
        setLivePos(
          kind === "button"
            ? normalizeButtonPosition(pos.x, pos.y)
            : normalizeImagePosition(pos.x, pos.y),
        );
      }
    };

    const onPointerUp = (ev: PointerEvent) => {
      const pos = clientToPercent(ev.clientX, ev.clientY);
      if (pos) {
        onMove(
          kind === "button"
            ? normalizeButtonPosition(pos.x, pos.y)
            : normalizeImagePosition(pos.x, pos.y),
        );
      }
      setDragging(null);
      setLivePos(null);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  const hint = buttonEditEnabled
    ? "Drag onto the page or drag buttons to move freely"
    : imageEditEnabled
      ? "Drag “New image” onto the page or drag images on the preview to reposition"
      : "";

  return (
    <div className="absolute inset-0 flex flex-col bg-neutral-800">
      <iframe
        ref={iframeRef}
        key={`${previewPath}-${previewKey}`}
        title="Site preview"
        src={previewPath}
        className="h-full w-full border-0 bg-white"
      />

      {canvasEditEnabled && canvasRect && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div
            className={`absolute rounded-sm border-2 border-dashed ${
              dragActive || dragging
                ? "border-brand-green bg-brand-green/5"
                : "border-brand-green/30 bg-brand-green/[0.03]"
            } ${dragActive ? "pointer-events-auto" : "pointer-events-none"}`}
            style={{
              top: canvasRect.top,
              left: canvasRect.left,
              width: canvasRect.width,
              height: canvasRect.height,
            }}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            onDragLeave={() => setLivePos(null)}
          />

          <div
            className={`absolute inset-0 ${dragActive ? "pointer-events-auto" : "pointer-events-none"}`}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
          />

          {buttonEditEnabled &&
            canvasButtons.map((btn) => {
              const isDragging =
                dragging?.kind === "button" && dragging.id === btn.id;
              const x = isDragging && livePos ? livePos.x : btn.x;
              const y = isDragging && livePos ? livePos.y : btn.y;
              const pixel = percentToOverlayStyle(x, y);
              if (!pixel) return null;

              return (
                <div
                  key={btn.id}
                  role="button"
                  tabIndex={0}
                  onPointerDown={(e) =>
                    startPointerDrag("button", btn.id, (pos) => {
                      onCanvasPosition(pos, { kind: "move", buttonId: btn.id });
                    }, e)
                  }
                  className={`pointer-events-auto absolute cursor-grab select-none active:cursor-grabbing ${
                    isDragging ? "z-20 opacity-90 ring-2 ring-brand-green" : "z-10"
                  }`}
                  style={{
                    left: pixel.left,
                    top: pixel.top,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span
                    className={`inline-block whitespace-nowrap rounded px-4 py-2 text-xs font-medium uppercase tracking-wide shadow-md ${
                      btn.style === "outline"
                        ? "border-2 border-brand-green bg-white text-brand-text"
                        : "bg-brand-accent text-white"
                    }`}
                  >
                    {btn.label}
                  </span>
                </div>
              );
            })}

          {imageEditEnabled &&
            canvasImages.map((img) => {
              const isDragging =
                dragging?.kind === "image" && dragging.id === img.id;
              const x = isDragging && livePos ? livePos.x : img.x;
              const y = isDragging && livePos ? livePos.y : img.y;
              const pixel = percentToOverlayStyle(x, y);
              if (!pixel || !onImageCanvasPosition) return null;
              const widthPct = img.width ?? DEFAULT_PLACED_IMAGE_WIDTH;
              const overlayWidth =
                canvasRect.width * (widthPct / 100);

              return (
                <div
                  key={img.id}
                  onPointerDown={(e) =>
                    startPointerDrag("image", img.id, (pos) => {
                      onImageCanvasPosition(pos, {
                        kind: "move",
                        imageId: img.id,
                      });
                    }, e)
                  }
                  className={`pointer-events-auto absolute cursor-grab active:cursor-grabbing ${
                    isDragging ? "z-20 ring-2 ring-brand-green" : "z-10"
                  }`}
                  style={{
                    left: pixel.left,
                    top: pixel.top,
                    width: overlayWidth,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.url}
                      alt=""
                      className="h-auto w-full rounded border-2 border-white/80 shadow-lg"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center rounded border-2 border-dashed border-brand-green bg-white/90 text-[10px] text-gray-600">
                      Add image URL in Photos panel
                    </div>
                  )}
                </div>
              );
            })}

          {dragActive && livePos && !dragging && (() => {
            const dot = percentToOverlayStyle(livePos.x, livePos.y);
            if (!dot) return null;
            return (
              <div
                className="pointer-events-none absolute z-30 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-green ring-4 ring-brand-green/30"
                style={{ left: dot.left, top: dot.top }}
              />
            );
          })()}
        </div>
      )}

      {hint && (
        <p className="pointer-events-none absolute bottom-2 left-2 right-2 z-20 rounded bg-black/70 px-2 py-1 text-center text-[10px] text-white">
          {hint}
        </p>
      )}
    </div>
  );
}
