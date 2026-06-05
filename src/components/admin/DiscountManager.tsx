"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DiscountCode = {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
};

export function DiscountManager({
  initialCodes,
}: {
  initialCodes: DiscountCode[];
}) {
  const router = useRouter();
  const [codes, setCodes] = useState(initialCodes);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState(10);
  const [maxUses, setMaxUses] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        type,
        value: type === "PERCENT" ? value : Math.round(value * 100),
        maxUses: maxUses ? Number(maxUses) : null,
      }),
    });

    const data = (await res.json()) as DiscountCode & { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to create code");
      return;
    }

    setCodes((prev) => [data, ...prev]);
    setCode("");
    router.refresh();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/discounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setCodes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !active } : c)),
    );
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this discount code?")) return;
    await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    setCodes((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="CODE"
          required
          className="border border-gray-300 px-3 py-2 text-sm uppercase"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}
          className="border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="PERCENT">Percent off</option>
          <option value="FIXED">Fixed $ off</option>
        </select>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          min={1}
          required
          placeholder={type === "PERCENT" ? "10" : "5.00"}
          step={type === "PERCENT" ? 1 : 0.01}
          className="border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          placeholder="Max uses (optional)"
          type="number"
          min={1}
          className="border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-brand-green px-4 py-2 text-sm text-white"
        >
          Add code
        </button>
        {error && (
          <p className="text-sm text-red-700 sm:col-span-full">{error}</p>
        )}
        <p className="text-xs text-gray-500 sm:col-span-full">
          Percent = 1–100. Fixed = dollar amount (e.g. 5 = $5 off).
        </p>
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono">{c.code}</td>
                <td className="px-4 py-3">
                  {c.type === "PERCENT" ? `${c.value}%` : `$${(c.value / 100).toFixed(2)}`}
                </td>
                <td className="px-4 py-3">
                  {c.usedCount}
                  {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                </td>
                <td className="px-4 py-3">
                  {c.active ? (
                    <span className="text-green-700">Active</span>
                  ) : (
                    <span className="text-gray-400">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(c.id, c.active)}
                    className="mr-3 text-brand-green hover:underline"
                  >
                    {c.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
