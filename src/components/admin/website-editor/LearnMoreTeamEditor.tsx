"use client";

import { ImageField } from "@/components/admin/website-editor/ImageField";
import type { LearnMoreTeamMember } from "@/lib/pages/learn-more-team";

const inputClass =
  "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

type LearnMoreTeamEditorProps = {
  members: LearnMoreTeamMember[];
  onChange: (members: LearnMoreTeamMember[]) => void;
};

function bioToText(bio: string[]): string {
  return bio.join("\n\n");
}

function textToBio(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function LearnMoreTeamEditor({
  members,
  onChange,
}: LearnMoreTeamEditorProps) {
  function updateMember(index: number, patch: Partial<LearnMoreTeamMember>) {
    onChange(
      members.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  }

  function removeMember(index: number) {
    onChange(members.filter((_, i) => i !== index));
  }

  function addMember() {
    onChange([
      ...members,
      {
        name: "New team member",
        image: "",
        bio: ["Add bio paragraphs here (blank line between paragraphs)."],
        coffee: "",
      },
    ]);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Team photos and bios shown on the Learn More page. Changes save with the
        page draft (Save button in the toolbar).
      </p>

      {members.map((member, index) => (
        <div
          key={`${member.name}-${index}`}
          className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-700">
              Member {index + 1}
            </p>
            {members.length > 1 && (
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="text-[11px] text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>

          <ImageField
            label="Photo"
            value={member.image ?? ""}
            onChange={(url) => updateMember(index, { image: url })}
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Name
            </label>
            <input
              value={member.name}
              onChange={(e) => updateMember(index, { name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Bio (paragraphs separated by a blank line)
            </label>
            <textarea
              value={bioToText(member.bio)}
              onChange={(e) =>
                updateMember(index, { bio: textToBio(e.target.value) })
              }
              rows={5}
              className={`${inputClass} text-xs leading-relaxed`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Coffee note (optional)
            </label>
            <input
              value={member.coffee ?? ""}
              onChange={(e) => updateMember(index, { coffee: e.target.value })}
              className={inputClass}
              placeholder="e.g. His coffee of choice is…"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addMember}
        className="w-full rounded border border-dashed border-gray-300 py-2 text-xs text-gray-600 hover:bg-white"
      >
        + Add team member
      </button>
    </div>
  );
}
