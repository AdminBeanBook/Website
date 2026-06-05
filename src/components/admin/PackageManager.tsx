"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type PackagePresetRow = {
  id: string;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightOz: number;
  isDefault: boolean;
};

export function PackageManager({
  initialPackages,
}: {
  initialPackages: PackagePresetRow[];
}) {
  const router = useRouter();
  const [packages, setPackages] = useState(initialPackages);
  const [name, setName] = useState("");
  const [lengthIn, setLengthIn] = useState(10);
  const [widthIn, setWidthIn] = useState(8);
  const [heightIn, setHeightIn] = useState(1);
  const [weightOz, setWeightOz] = useState(13);
  const [makeDefault, setMakeDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/admin/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        lengthIn,
        widthIn,
        heightIn,
        weightOz,
        isDefault: makeDefault,
      }),
    });

    const data = (await res.json()) as PackagePresetRow & { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to create package");
      return;
    }

    setPackages((prev) => {
      const next = makeDefault
        ? prev.map((p) => ({ ...p, isDefault: false }))
        : prev;
      return [data, ...next].sort((a, b) =>
        a.isDefault === b.isDefault ? a.name.localeCompare(b.name) : a.isDefault ? -1 : 1,
      );
    });
    setName("");
    setMakeDefault(false);
    router.refresh();
  }

  async function setDefault(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Failed to set default");
      return;
    }
    setPackages((prev) =>
      prev.map((p) => ({ ...p, isDefault: p.id === id })),
    );
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this package preset?")) return;
    setError(null);

    const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to delete");
      return;
    }

    setPackages((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0 && !filtered.some((p) => p.isDefault)) {
        return filtered.map((p, i) =>
          i === 0 ? { ...p, isDefault: true } : p,
        );
      }
      return filtered;
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div className="sm:col-span-2 lg:col-span-3">
          <h2 className="text-lg font-medium">Add package</h2>
          <p className="mt-1 text-sm text-gray-500">
            Saved presets appear when shipping orders. Dimensions in inches, weight in ounces.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="pkg-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="pkg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bean Book bubble mailer"
            required
            className="w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="pkg-weight" className="mb-1 block text-sm font-medium">
            Weight (oz)
          </label>
          <input
            id="pkg-weight"
            type="number"
            min={0.1}
            step={0.1}
            value={weightOz}
            onChange={(e) => setWeightOz(Number(e.target.value))}
            required
            className="w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="pkg-l" className="mb-1 block text-sm font-medium">
            Length (in)
          </label>
          <input
            id="pkg-l"
            type="number"
            min={0.1}
            step={0.1}
            value={lengthIn}
            onChange={(e) => setLengthIn(Number(e.target.value))}
            required
            className="w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="pkg-w" className="mb-1 block text-sm font-medium">
            Width (in)
          </label>
          <input
            id="pkg-w"
            type="number"
            min={0.1}
            step={0.1}
            value={widthIn}
            onChange={(e) => setWidthIn(Number(e.target.value))}
            required
            className="w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="pkg-h" className="mb-1 block text-sm font-medium">
            Height (in)
          </label>
          <input
            id="pkg-h"
            type="number"
            min={0.1}
            step={0.1}
            value={heightIn}
            onChange={(e) => setHeightIn(Number(e.target.value))}
            required
            className="w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={makeDefault}
              onChange={(e) => setMakeDefault(e.target.checked)}
            />
            Set as default for new shipments
          </label>
          <button
            type="submit"
            className="ml-auto rounded bg-brand-green px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add package
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-700 sm:col-span-2 lg:col-span-3" role="alert">
            {error}
          </p>
        )}
      </form>

      <section>
        <h2 className="mb-4 text-lg font-medium">Saved packages</h2>
        {packages.length === 0 ? (
          <p className="text-gray-500">
            No packages yet. Add one above or run{" "}
            <code className="text-xs">npm run db:seed</code> for the default mailer.
          </p>
        ) : (
          <ul className="space-y-3">
            {packages.map((pkg) => (
              <li
                key={pkg.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {pkg.name}
                    {pkg.isDefault && (
                      <span className="ml-2 rounded bg-brand-green/10 px-2 py-0.5 text-xs font-medium text-brand-green">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {pkg.lengthIn}×{pkg.widthIn}×{pkg.heightIn} in · {pkg.weightOz} oz
                  </p>
                </div>
                <div className="flex gap-2">
                  {!pkg.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefault(pkg.id)}
                      className="text-sm text-brand-green hover:underline"
                    >
                      Make default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(pkg.id)}
                    className="text-sm text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
