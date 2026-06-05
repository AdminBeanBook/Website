"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ContactTagRow } from "@/lib/contacts/types";

const PRESET_COLORS = [
  "#226932",
  "#c4a574",
  "#f5f0e6",
  "#8b4513",
  "#1e3a5f",
  "#7c3aed",
  "#b45309",
];

type TagsManagerProps = {
  initialTags: ContactTagRow[];
};

const inputClass =
  "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

export function TagsManager({ initialTags }: TagsManagerProps) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed to create tag");
      return;
    }
    setTags((list) => [...list, data]);
    setName("");
    setMessage("Tag created");
    router.refresh();
  }

  async function updateTag(
    tag: ContactTagRow,
    patch: { name?: string; color?: string },
  ) {
    const res = await fetch(`/api/admin/tags/${tag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as ContactTagRow;
    setTags((list) => list.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function removeTag(tag: ContactTagRow) {
    const count = tag.contactCount ?? 0;
    const msg =
      count > 0
        ? `Delete tag "${tag.name}"? It is on ${count} contact(s); they will keep the tag removed.`
        : `Delete tag "${tag.name}"?`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/admin/tags/${tag.id}`, { method: "DELETE" });
    if (!res.ok) return;
    setTags((list) => list.filter((t) => t.id !== tag.id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Create tag</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tags label contacts for filtering and bulk email (e.g. Shop, Partner,
          Press).
        </p>
        <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1">
            <label className="text-xs font-medium text-gray-600">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Coffee shop"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Color</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 ${
                    color === c ? "border-gray-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-2 h-8 w-full cursor-pointer"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Add tag
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Your tags</h2>
        {tags.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No tags yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                onUpdate={updateTag}
                onRemove={removeTag}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-gray-500">
        Assign tags on the{" "}
        <Link
          href="/admin/settings/contacts"
          className="text-brand-green hover:underline"
        >
          Contacts
        </Link>{" "}
        tab, then target them from{" "}
        <Link href="/admin/email" className="text-brand-green hover:underline">
          Email
        </Link>
        .
      </p>

      {message && (
        <p className="text-sm text-green-700" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function TagRow({
  tag,
  onUpdate,
  onRemove,
}: {
  tag: ContactTagRow;
  onUpdate: (t: ContactTagRow, patch: { name?: string; color?: string }) => void;
  onRemove: (t: ContactTagRow) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      {editing ? (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} max-w-[10rem]`}
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-12"
          />
          <button
            type="button"
            onClick={async () => {
              await onUpdate(tag, { name, color });
              setEditing(false);
            }}
            className="text-xs text-brand-green hover:underline"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-gray-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <span className="font-medium text-gray-900">{tag.name}</span>
          <span className="text-xs text-gray-400">{tag.slug}</span>
          <span className="text-xs text-gray-500">
            · {tag.contactCount ?? 0} contacts
          </span>
        </div>
      )}
      {!editing && (
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-brand-green hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onRemove(tag)}
            className="text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      )}
    </li>
  );
}
