"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ContactRow, ContactTagRow } from "@/lib/contacts/types";

type ContactsManagerProps = {
  initialContacts: ContactRow[];
  initialTags: ContactTagRow[];
};

const inputClass =
  "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

export function ContactsManager({
  initialContacts,
  initialTags,
}: ContactsManagerProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);
  const [tags] = useState(initialTags);
  const [filterTagId, setFilterTagId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [bulkPaste, setBulkPaste] = useState("");
  const [bulkTagId, setBulkTagId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!filterTagId) return contacts;
    return contacts.filter((c) => c.tags.some((t) => t.id === filterTagId));
  }, [contacts, filterTagId]);

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/admin/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: email || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
        tagIds: selectedTagIds,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to add contact");
      return;
    }

    setContacts((list) => [
      ...list,
      {
        ...data,
        createdAt: data.createdAt ?? new Date().toISOString(),
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      },
    ]);
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setSelectedTagIds([]);
    setMessage("Contact added");
    router.refresh();
  }

  async function importBulk() {
    if (!bulkPaste.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bulk: bulkPaste,
        defaultTagId: bulkTagId || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Import failed");
      return;
    }
    const listRes = await fetch(
      filterTagId
        ? `/api/admin/contacts?tagId=${filterTagId}`
        : "/api/admin/contacts",
    );
    if (listRes.ok) {
      const list = (await listRes.json()) as ContactRow[];
      setContacts(
        list.map((c) => ({
          ...c,
          createdAt:
            typeof c.createdAt === "string"
              ? c.createdAt
              : new Date(c.createdAt).toISOString(),
          updatedAt:
            typeof c.updatedAt === "string"
              ? c.updatedAt
              : new Date(c.updatedAt).toISOString(),
        })),
      );
    }
    setBulkPaste("");
    setMessage("Emails imported as contacts");
    router.refresh();
  }

  async function updateContact(
    contact: ContactRow,
    patch: Partial<ContactRow> & { tagIds?: string[] },
  ) {
    const res = await fetch(`/api/admin/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as ContactRow;
    setContacts((list) =>
      list.map((c) =>
        c.id === updated.id
          ? {
              ...updated,
              createdAt:
                typeof updated.createdAt === "string"
                  ? updated.createdAt
                  : new Date(updated.createdAt).toISOString(),
              updatedAt:
                typeof updated.updatedAt === "string"
                  ? updated.updatedAt
                  : new Date(updated.updatedAt).toISOString(),
            }
          : c,
      ),
    );
  }

  async function removeContact(contact: ContactRow) {
    if (!confirm(`Remove ${contact.name}?`)) return;
    const res = await fetch(`/api/admin/contacts/${contact.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setContacts((list) => list.filter((c) => c.id !== contact.id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {tags.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Create tags first under{" "}
          <Link
            href="/admin/settings/contacts/tags"
            className="font-medium underline"
          >
            Tags tab
          </Link>{" "}
          so you can label contacts for bulk email.
        </p>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Add contact</h2>
        <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-600">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>
          {tags.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-gray-600">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded"
                    />
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              Add contact
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Import emails</h2>
        <p className="mt-1 text-sm text-gray-500">
          Paste one email per line (or comma-separated). Optional tag applies to
          all imports.
        </p>
        <textarea
          value={bulkPaste}
          onChange={(e) => setBulkPaste(e.target.value)}
          rows={3}
          className={`${inputClass} mt-3 font-mono text-xs`}
          placeholder="shop@example.com"
        />
        {tags.length > 0 && (
          <select
            value={bulkTagId}
            onChange={(e) => setBulkTagId(e.target.value)}
            className={`${inputClass} mt-2 max-w-xs`}
          >
            <option value="">No tag on import</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={importBulk}
          disabled={loading}
          className="mt-2 text-sm text-brand-green hover:underline disabled:opacity-60"
        >
          Import as contacts
        </button>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            All contacts ({filtered.length})
          </h2>
          {tags.length > 0 && (
            <select
              value={filterTagId}
              onChange={(e) => setFilterTagId(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No contacts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {filtered.map((contact) => (
              <ContactRowEditor
                key={contact.id}
                contact={contact}
                tags={tags}
                onUpdate={updateContact}
                onRemove={removeContact}
              />
            ))}
          </ul>
        )}
      </section>

      {message && (
        <p className="text-sm text-green-700" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function ContactRowEditor({
  contact,
  tags,
  onUpdate,
  onRemove,
}: {
  contact: ContactRow;
  tags: ContactTagRow[];
  onUpdate: (
    c: ContactRow,
    patch: Partial<ContactRow> & { tagIds?: string[] },
  ) => void;
  onRemove: (c: ContactRow) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [tagIds, setTagIds] = useState(contact.tags.map((t) => t.id));

  function toggleTag(id: string) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function save() {
    await onUpdate(contact, {
      name,
      email: email || null,
      phone: phone || null,
      tagIds,
    });
    setEditing(false);
  }

  if (!editing) {
    return (
      <li className="flex flex-wrap items-start justify-between gap-3 py-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900">
            {contact.name}
            {!contact.active && (
              <span className="ml-2 text-xs text-gray-400">(inactive)</span>
            )}
          </p>
          {contact.email && (
            <p className="text-sm text-gray-600">{contact.email}</p>
          )}
          {contact.phone && (
            <p className="text-sm text-gray-500">{contact.phone}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {contact.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-brand-green hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onUpdate(contact, { active: !contact.active })}
            className="text-gray-600 hover:underline"
          >
            {contact.active ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            onClick={() => onRemove(contact)}
            className="text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="space-y-2 border-l-2 border-brand-green py-4 pl-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
        placeholder="Name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
        placeholder="Email"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className={inputClass}
        placeholder="Phone"
      />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <label
            key={tag.id}
            className="inline-flex items-center gap-1 text-xs"
          >
            <input
              type="checkbox"
              checked={tagIds.includes(tag.id)}
              onChange={() => toggleTag(tag.id)}
            />
            {tag.name}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          className="text-sm text-brand-green hover:underline"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-gray-500 hover:underline"
        >
          Cancel
        </button>
      </div>
    </li>
  );
}
