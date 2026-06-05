"use client";

import {
  BB_IMAGE_DRAG_MIME,
  encodeImageDragPayload,
  type ImageDragPayload,
} from "@/components/admin/website-editor/image-placement";
import {
  dispatchCanvasDragEnd,
  dispatchCanvasDragStart,
} from "@/components/admin/website-editor/EditorPreviewFrame";

type DraggableImageHandleProps = {
  payload: ImageDragPayload;
  children: React.ReactNode;
  className?: string;
  gripOnly?: boolean;
  title?: string;
};

function attachDrag(e: React.DragEvent, payload: ImageDragPayload) {
  e.dataTransfer.setData(BB_IMAGE_DRAG_MIME, encodeImageDragPayload(payload));
  e.dataTransfer.effectAllowed = "copy";
  dispatchCanvasDragStart();
}

export function DraggableImageHandle({
  payload,
  children,
  className = "",
  gripOnly = false,
  title = "Drag onto the page preview to place this image",
}: DraggableImageHandleProps) {
  if (gripOnly) {
    return (
      <div className={className}>
        <div
          draggable
          title={title}
          onDragStart={(e) => attachDrag(e, payload)}
          onDragEnd={() => dispatchCanvasDragEnd()}
          className="flex cursor-grab items-center gap-1.5 border-b border-gray-100 px-2 py-1.5 text-xs text-gray-500 active:cursor-grabbing"
        >
          <span aria-hidden className="text-base leading-none">
            ⠿
          </span>
          Drag to move on page
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      draggable
      title={title}
      onDragStart={(e) => attachDrag(e, payload)}
      onDragEnd={() => dispatchCanvasDragEnd()}
      className={`cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </div>
  );
}
