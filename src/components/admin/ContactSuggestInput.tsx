"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatContactAddress } from "@/lib/contacts/address";

export type ContactSuggestion = {
  id: string;
  company: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  taxExempt: boolean;
  addressName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostal: string | null;
  addressCountry: string | null;
};

type ContactSuggestInputProps = {
  id: string;
  label: string;
  required?: boolean;
  type?: "text" | "email";
  value: string;
  placeholder?: string;
  autoComplete?: string;
  className: string;
  query: string;
  onChange: (value: string) => void;
  onSelect: (contact: ContactSuggestion) => void;
};

export function splitContactName(full: string): { first: string; last: string } {
  const trimmed = full.trim();
  if (!trimmed) return { first: "", last: "" };
  const space = trimmed.indexOf(" ");
  if (space === -1) return { first: trimmed, last: "" };
  return {
    first: trimmed.slice(0, space),
    last: trimmed.slice(space + 1).trim(),
  };
}

export function joinContactName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(" ");
}

export function ContactSuggestInput({
  id,
  label,
  required,
  type = "text",
  value,
  placeholder,
  autoComplete = "off",
  className,
  query,
  onChange,
  onSelect,
}: ContactSuggestInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [matches, setMatches] = useState<ContactSuggestion[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setMatches([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      const res = await fetch(
        `/api/admin/contacts?q=${encodeURIComponent(q)}`,
      );
      if (!res.ok) return;
      const list = (await res.json()) as ContactSuggestion[];
      setMatches(list);
      setHighlight(0);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const showList = open && matches.length > 0;

  function pick(contact: ContactSuggestion) {
    onSelect(contact);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="mb-1 block text-xs text-gray-500">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        className={className}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((i) => (i + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((i) => (i - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            const chosen = matches[highlight];
            if (chosen) pick(chosen);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {matches.map((contact, index) => {
            const addressLabel = formatContactAddress(contact);
            return (
              <li
                key={contact.id}
                role="option"
                aria-selected={index === highlight}
              >
                <button
                  type="button"
                  className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
                    index === highlight ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => pick(contact)}
                >
                  {contact.company ? (
                    <span className="text-xs text-gray-500">{contact.company}</span>
                  ) : null}
                  <span className="font-medium text-gray-900">{contact.name}</span>
                  <span className="text-xs text-gray-500">
                    {[contact.email, contact.phone].filter(Boolean).join(" · ") ||
                      "No email"}
                    {contact.taxExempt ? " · Tax exempt" : ""}
                  </span>
                  {addressLabel ? (
                    <span className="text-xs text-gray-400">{addressLabel}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
