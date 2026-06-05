"use client";

import { ImageField } from "@/components/admin/website-editor/ImageField";
import { DraggableImageHandle } from "@/components/admin/website-editor/DraggableImageHandle";
import {
  DEFAULT_PLACED_IMAGE_WIDTH,
  type PlacedPageImage,
} from "@/lib/pages/placed-images";

const inputClass =
  "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

type PlacedImagesEditorProps = {
  images: PlacedPageImage[];
  onChange: (images: PlacedPageImage[]) => void;
  learnMoreTeamSection?: React.ReactNode;
};

export function PlacedImagesEditor({
  images,
  onChange,
  learnMoreTeamSection,
}: PlacedImagesEditorProps) {
  function updateImage(index: number, patch: Partial<PlacedPageImage>) {
    onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function addImage() {
    onChange([
      ...images,
      {
        id: `img-${Date.now()}`,
        url: "",
        x: 50,
        y: 50,
        width: DEFAULT_PLACED_IMAGE_WIDTH,
      },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700">Free-placed images</p>
        <p className="text-xs text-gray-500">
          Add images and drag them anywhere on the page preview. Open this Photos
          tab while positioning. Save draft when finished, then publish.
        </p>
        <DraggableImageHandle
          payload={{ kind: "new" }}
          className="flex items-center gap-2 rounded-lg border border-dashed border-brand-green/50 bg-brand-green/5 px-3 py-2.5 text-sm font-medium text-brand-green"
        >
          <span aria-hidden>⠿</span>
          New image
        </DraggableImageHandle>
      </div>

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-xs text-gray-600">
          No placed images yet. Drag “New image” onto the preview, or use Add
          image below.
        </p>
      ) : (
        images.map((img, index) => (
          <DraggableImageHandle
            key={img.id}
            payload={{ kind: "move", imageId: img.id }}
            gripOnly
            className="rounded border border-gray-200 bg-white text-sm shadow-sm"
          >
            <div className="space-y-2 p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500">
                  Position: {img.x}% × {img.y}%
                </p>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <ImageField
                label="Image"
                value={img.url}
                onChange={(url) => updateImage(index, { url })}
              />
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Alt text (optional)
                </label>
                <input
                  value={img.alt ?? ""}
                  onChange={(e) => updateImage(index, { alt: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Width (% of page)
                </label>
                <input
                  type="number"
                  min={8}
                  max={80}
                  step={1}
                  value={img.width ?? DEFAULT_PLACED_IMAGE_WIDTH}
                  onChange={(e) =>
                    updateImage(index, { width: Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </DraggableImageHandle>
        ))
      )}

      <button
        type="button"
        onClick={addImage}
        className="w-full rounded border border-dashed border-gray-300 py-2 text-xs text-gray-600 hover:bg-gray-50"
      >
        + Add image (then drag on preview)
      </button>

      {learnMoreTeamSection}
    </div>
  );
}
