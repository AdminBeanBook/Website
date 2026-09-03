"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatContactAddress } from "@/lib/contacts/address";
import type { ContactRow, ContactTagRow } from "@/lib/contacts/types";

type ContactsManagerProps = {
  initialContacts: ContactRow[];
  initialTags: ContactTagRow[];
};

const inputClass =
  "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

type AddressFormValue = {
  addressName: string;
  addressLine1: string;
  addressLine2: string;
  addressCity: string;
  addressState: string;
  addressPostal: string;
};

const EMPTY_ADDRESS: AddressFormValue = {
  addressName: "",
  addressLine1: "",
  addressLine2: "",
  addressCity: "",
  addressState: "",
  addressPostal: "",
};

function addressFromContact(contact: ContactRow): AddressFormValue {
  return {
    addressName: contact.addressName ?? "",
    addressLine1: contact.addressLine1 ?? "",
    addressLine2: contact.addressLine2 ?? "",
    addressCity: contact.addressCity ?? "",
    addressState: contact.addressState ?? "",
    addressPostal: contact.addressPostal ?? "",
  };
}

function AddressFields({
  value,
  onChange,
}: {
  value: AddressFormValue;
  onChange: (next: AddressFormValue) => void;
}) {
  function setField(key: keyof AddressFormValue, next: string) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <p className="text-xs font-medium text-gray-600">Shipping address</p>
      <input
        value={value.addressName}
        onChange={(e) => setField("addressName", e.target.value)}
        placeholder="Recipient name"
        className={inputClass}
      />
      <input
        value={value.addressLine1}
        onChange={(e) => setField("addressLine1", e.target.value)}
        placeholder="Street address"
        className={inputClass}
      />
      <input
        value={value.addressLine2}
        onChange={(e) => setField("addressLine2", e.target.value)}
        placeholder="Apt / suite"
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={value.addressCity}
          onChange={(e) => setField("addressCity", e.target.value)}
          placeholder="City"
          className={inputClass}
        />
        <input
          value={value.addressState}
          onChange={(e) => setField("addressState", e.target.value)}
          placeholder="State"
          className={inputClass}
        />
      </div>
      <input
        value={value.addressPostal}
        onChange={(e) => setField("addressPostal", e.target.value)}
        placeholder="ZIP"
        className={`${inputClass} max-w-xs`}
      />
    </div>
  );
}

export function ContactsManager({
  initialContacts,
  initialTags,
}: ContactsManagerProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);
  const [tags] = useState(initialTags);
  const [filterTagId, setFilterTagId] = useState("");
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [taxExempt, setTaxExempt] = useState(false);
  const [address, setAddress] = useState<AddressFormValue>(EMPTY_ADDRESS);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filterTagId && !c.tags.some((t) => t.id === filterTagId)) {
        return false;
      }
      if (!q) return true;
      return (
        (c.company?.toLowerCase().includes(q) ?? false) ||
        c.name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.toLowerCase().includes(q) ?? false) ||
        (c.notes?.toLowerCase().includes(q) ?? false) ||
        (c.addressLine1?.toLowerCase().includes(q) ?? false) ||
        (c.addressCity?.toLowerCase().includes(q) ?? false) ||
        (c.addressPostal?.toLowerCase().includes(q) ?? false) ||
        c.tags.some((t) => t.name.toLowerCase().includes(q))
      );
    });
  }, [contacts, filterTagId, query]);

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
        company: company || undefined,
        name,
        email: email || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
        taxExempt,
        ...address,
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
    setCompany("");
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setTaxExempt(false);
    setAddress(EMPTY_ADDRESS);
    setSelectedTagIds([]);
    setMessage("Contact added");
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
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600">Company</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Coffee shop or business name"
              className={inputClass}
            />
          </div>
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
          <AddressFields value={address} onChange={setAddress} />
          <div className="flex items-end sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={taxExempt}
                onChange={(e) => setTaxExempt(e.target.checked)}
                className="rounded"
              />
              Tax exempt — no sales tax on invoices (typical for shops)
            </label>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            All contacts ({filtered.length}
            {query.trim() || filterTagId
              ? ` of ${contacts.length}`
              : ""}
            )
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company, name, email, phone, address, notes, or tag…"
              className="min-w-[14rem] flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm sm:min-w-[18rem]"
            />
            {tags.length > 0 && (
              <select
                value={filterTagId}
                onChange={(e) => setFilterTagId(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
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
        </div>

        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            {contacts.length === 0
              ? "No contacts yet."
              : "No contacts match your search."}
          </p>
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
  const [company, setCompany] = useState(contact.company ?? "");
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [tagIds, setTagIds] = useState(contact.tags.map((t) => t.id));
  const [taxExempt, setTaxExempt] = useState(contact.taxExempt);
  const [address, setAddress] = useState(() => addressFromContact(contact));
  const addressLabel = formatContactAddress(contact);

  function toggleTag(id: string) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function startEdit() {
    setCompany(contact.company ?? "");
    setName(contact.name);
    setEmail(contact.email ?? "");
    setPhone(contact.phone ?? "");
    setTagIds(contact.tags.map((t) => t.id));
    setTaxExempt(contact.taxExempt);
    setAddress(addressFromContact(contact));
    setEditing(true);
  }

  async function save() {
    await onUpdate(contact, {
      company: company || null,
      name,
      email: email || null,
      phone: phone || null,
      tagIds,
      taxExempt,
      ...address,
      addressCountry: address.addressLine1.trim() ? "US" : null,
    });
    setEditing(false);
  }

  if (!editing) {
    return (
      <li className="flex flex-wrap items-start justify-between gap-3 py-4">
        <div className="min-w-0 flex-1">
          {contact.company ? (
            <p className="text-sm text-gray-600">{contact.company}</p>
          ) : null}
          <p className="font-medium text-gray-900">
            {contact.name}
            {!contact.active && (
              <span className="ml-2 text-xs text-gray-400">(inactive)</span>
            )}
            {contact.taxExempt && (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                Tax exempt
              </span>
            )}
          </p>
          {contact.email && (
            <p className="text-sm text-gray-600">{contact.email}</p>
          )}
          {contact.phone && (
            <p className="text-sm text-gray-500">{contact.phone}</p>
          )}
          {addressLabel && (
            <p className="text-sm text-gray-500">{addressLabel}</p>
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
            onClick={startEdit}
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
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className={inputClass}
        placeholder="Company"
      />
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
      <AddressFields value={address} onChange={setAddress} />
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
      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={taxExempt}
          onChange={(e) => setTaxExempt(e.target.checked)}
          className="rounded"
        />
        Tax exempt
      </label>
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
