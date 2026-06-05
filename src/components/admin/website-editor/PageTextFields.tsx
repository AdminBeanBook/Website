"use client";

import { getPageTextSlots } from "@/lib/pages/text-slots";
import type { PageTextColorOverrides } from "@/lib/pages/text-colors";
import { resolvePageTextColor } from "@/lib/pages/text-colors";
import type { SiteTextColors } from "@/lib/site-config/types";

type PageTextFieldsProps = {
  template: string;
  siteText: SiteTextColors;
  title: string;
  subtitle: string;
  body: string;
  textColors: PageTextColorOverrides;
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onTextColorChange: (slotId: string, color: string) => void;
  showPageSettings?: boolean;
  pageEnabled?: boolean;
  showInNav?: boolean;
  onPageEnabledChange?: (value: boolean) => void;
  onShowInNavChange?: (value: boolean) => void;
  bodyHint?: string;
  extraFields?: React.ReactNode;
};

function ColorPickerRow({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (hex: string) => void;
}) {
  const display = value || fallback;
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label} color
      </label>
      <div className="flex gap-2">
        <input
          type="color"
          value={display}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-gray-300"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          className="flex-1 rounded border border-gray-300 px-2 py-1 font-mono text-xs"
        />
      </div>
      {!value && (
        <p className="mt-0.5 text-[10px] text-gray-400">
          Using site default ({fallback})
        </p>
      )}
    </div>
  );
}

export function PageTextFields({
  template,
  siteText,
  title,
  subtitle,
  body,
  textColors,
  onTitleChange,
  onSubtitleChange,
  onBodyChange,
  onTextColorChange,
  showPageSettings,
  pageEnabled,
  showInNav,
  onPageEnabledChange,
  onShowInNavChange,
  bodyHint,
  extraFields,
}: PageTextFieldsProps) {
  const slots = getPageTextSlots(template);
  const hasSubtitle = slots.some((s) => s.id === "heroSubtitle");
  const hasBodyField = slots.some((s) => s.id === "body");

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Set copy and an optional color per element. Press Enter for a new line;
        on Body fields, leave a blank line between paragraphs. Leave a color
        empty to use the site default from the Colors tab.
      </p>

      {showPageSettings && (
        <>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pageEnabled}
              onChange={(e) => onPageEnabledChange?.(e.target.checked)}
            />
            Page enabled (visible when published)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInNav}
              onChange={(e) => onShowInNavChange?.(e.target.checked)}
            />
            Show in navigation
          </label>
        </>
      )}

      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Hero & content
        </p>
        <div>
          <label className="mb-1 block text-xs font-medium">Title</label>
          <textarea
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            rows={3}
            className="mb-2 w-full resize-y rounded border border-gray-300 px-2 py-1.5 text-sm leading-relaxed"
          />
          <ColorPickerRow
            label="Title"
            value={textColors.heroTitle ?? ""}
            fallback={resolvePageTextColor(
              "heroTitle",
              template,
              {},
              siteText,
            )}
            onChange={(c) => onTextColorChange("heroTitle", c)}
          />
        </div>

        {hasSubtitle && (
          <div>
            <label className="mb-1 block text-xs font-medium">Subtitle</label>
            <textarea
              value={subtitle}
              onChange={(e) => onSubtitleChange(e.target.value)}
              rows={4}
              className="mb-2 w-full resize-y rounded border border-gray-300 px-2 py-1.5 text-sm leading-relaxed"
            />
            <ColorPickerRow
              label="Subtitle"
              value={textColors.heroSubtitle ?? ""}
              fallback={resolvePageTextColor(
                "heroSubtitle",
                template,
                {},
                siteText,
              )}
              onChange={(c) => onTextColorChange("heroSubtitle", c)}
            />
          </div>
        )}

        {hasBodyField && (
          <div>
            <label className="mb-1 block text-xs font-medium">Body</label>
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={8}
              className="mb-2 w-full resize-y rounded border border-gray-300 px-2 py-1.5 text-sm leading-relaxed"
            />
            {bodyHint && (
              <p className="mb-2 text-xs text-gray-400">{bodyHint}</p>
            )}
            <ColorPickerRow
              label="Body"
              value={textColors.body ?? ""}
              fallback={resolvePageTextColor("body", template, {}, siteText)}
              onChange={(c) => onTextColorChange("body", c)}
            />
          </div>
        )}
      </div>

      {slots
        .filter(
          (s) =>
            s.id !== "heroTitle" &&
            s.id !== "heroSubtitle" &&
            s.id !== "body",
        )
        .map((slot) => (
          <ColorPickerRow
            key={slot.id}
            label={slot.label}
            value={textColors[slot.id] ?? ""}
            fallback={resolvePageTextColor(slot.id, template, {}, siteText)}
            onChange={(c) => onTextColorChange(slot.id, c)}
          />
        ))}

      {extraFields}
    </div>
  );
}
