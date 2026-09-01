"use client";

import { addableSectionTypes, sectionLabel, type PageSection, type PageSectionType } from "@/lib/pages/sections";

type SectionListProps = {
  sections: PageSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAdd: (type: PageSectionType) => void;
  onToggle: (id: string) => void;
};

export function SectionList({
  sections,
  selectedId,
  onSelect,
  onReorder,
  onAdd,
  onToggle,
}: SectionListProps) {
  const addable = addableSectionTypes(sections);

  function handleDrop(targetIndex: number, e: React.DragEvent) {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(from)) return;
    onReorder(from, targetIndex);
  }

  return (
    <div className="space-y-1">
      <p className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        Template
      </p>
      {sections.map((section, index) => (
        <div
          key={section.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", String(index));
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(index, e)}
          className={`flex items-center gap-1 rounded-lg ${
            selectedId === section.id
              ? "bg-white shadow-sm ring-1 ring-sky-400"
              : "hover:bg-white/80"
          }`}
        >
          <button
            type="button"
            onClick={() => onSelect(section.id)}
            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-xs"
          >
            <span className="cursor-grab text-gray-400" aria-hidden>
              ⠿
            </span>
            <span className={`truncate ${section.enabled ? "text-gray-800" : "text-gray-400 line-through"}`}>
              {sectionLabel(section.type)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onToggle(section.id)}
            className="px-2 py-2 text-[10px] text-gray-500 hover:text-gray-800"
            title={section.enabled ? "Hide section" : "Show section"}
          >
            {section.enabled ? "On" : "Off"}
          </button>
        </div>
      ))}
      {addable.length > 0 ? (
        <div className="pt-2">
          <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Add section
          </p>
          {addable.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onAdd(type)}
              className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-gray-600 hover:bg-white"
            >
              + {sectionLabel(type)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
