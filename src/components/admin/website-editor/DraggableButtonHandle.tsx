"use client";

import {
  BB_BUTTON_DRAG_MIME,
  encodeButtonDragPayload,
  type ButtonDragPayload,
} from "@/components/admin/website-editor/button-placement";
import {
  dispatchCanvasDragEnd,
  dispatchCanvasDragStart,
} from "@/components/admin/website-editor/EditorPreviewFrame";

type DraggableButtonHandleProps = {
  payload: ButtonDragPayload;
  children: React.ReactNode;
  className?: string;
  /** When true, only the grip strip is draggable (for panels with inputs). */
  gripOnly?: boolean;
  title?: string;
};

function attachDrag(
  e: React.DragEvent,
  payload: ButtonDragPayload,
) {
  e.dataTransfer.setData(BB_BUTTON_DRAG_MIME, encodeButtonDragPayload(payload));
  e.dataTransfer.effectAllowed = "copy";
  dispatchCanvasDragStart();
}

export function DraggableButtonHandle({
  payload,
  children,
  className = "",
  gripOnly = false,
  title = "Drag onto the page preview to place this button",
}: DraggableButtonHandleProps) {
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
