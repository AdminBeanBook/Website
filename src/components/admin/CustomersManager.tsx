"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ContactTagRow } from "@/lib/contacts/types";
import type { CustomerRow } from "@/lib/customers/types";

type CustomersManagerProps = {
  initialCustomers: CustomerRow[];
  initialTags: ContactTagRow[];
};

export function CustomersManager({
  initialCustomers,
  initialTags,
}: CustomersManagerProps) {
  const [query, setQuery] = useState("");
  const [filterTagId, setFilterTagId] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialCustomers.filter((customer) => {
      if (filterTagId && !customer.tags.some((tag) => tag.id === filterTagId)) {
        return false;
      }
      if (!q) return true;
      return (
        customer.email.toLowerCase().includes(q) ||
        (customer.name?.toLowerCase().includes(q) ?? false) ||
        (customer.phone?.toLowerCase().includes(q) ?? false) ||
        customer.tags.some((tag) => tag.name.toLowerCase().includes(q))
      );
    });
  }, [initialCustomers, query, filterTagId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Customers</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, or tag…"
          className="min-w-[16rem] flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        {initialTags.length > 0 && (
          <select
            value={filterTagId}
            onChange={(e) => setFilterTagId(e.target.value)}
            className="rounded border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">All tags</option>
            {initialTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">
          {initialCustomers.length === 0
            ? "Customers appear here after their first order."
            : "No customers match your search."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm">
          {filtered.map((customer) => (
            <li key={customer.id}>
              <Link
                href={`/admin/settings/customers/${customer.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{customer.email}</p>
                  <p className="text-sm text-gray-600">
                    {customer.name ?? "No name"} · {customer.phone ?? "No phone"}
                  </p>
                  {customer.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {customer.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="shrink-0 text-sm text-gray-500">
                  {customer.orderCount} order{customer.orderCount === 1 ? "" : "s"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-gray-500">
        Showing {filtered.length} of {initialCustomers.length} customers
      </p>
    </div>
  );
}
