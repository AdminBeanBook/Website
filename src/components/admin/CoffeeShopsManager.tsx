"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  compareCoffeeShopNames,
  parseLocationsJson,
  type CoffeeShopRow,
  type LocationLabel,
} from "@/lib/coffee-shops";

type CoffeeShopsManagerProps = {
  initialShops: CoffeeShopRow[];
  /** Compact layout for the website editor right panel */
  variant?: "page" | "sidebar";
  onAfterChange?: () => void;
};

const inputClass =
  "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

function locationsToText(locations: string[]): string {
  return locations.join("\n");
}

function sortShopsByName(list: CoffeeShopRow[]): CoffeeShopRow[] {
  return [...list].sort((a, b) => compareCoffeeShopNames(a.name, b.name));
}

export function CoffeeShopsManager({
  initialShops,
  variant = "page",
  onAfterChange,
}: CoffeeShopsManagerProps) {
  const router = useRouter();
  const isSidebar = variant === "sidebar";
  const [shops, setShops] = useState(() => sortShopsByName(initialShops));
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [locationLabel, setLocationLabel] = useState<LocationLabel>("Location");
  const [locationsText, setLocationsText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function notifyChange() {
    onAfterChange?.();
    if (!isSidebar) router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/admin/shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        website,
        locationLabel,
        locationsText,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to add shop");
      return;
    }

    setShops((list) =>
      sortShopsByName([
        ...list,
        {
          id: data.id,
          name: data.name,
          website: data.website,
          locationLabel:
            data.locationLabel === "Locations" ? "Locations" : "Location",
          locations: parseLocationsJson(data.locationsJson),
          sortOrder: data.sortOrder,
          active: data.active,
        },
      ]),
    );
    setName("");
    setWebsite("");
    setLocationLabel("Location");
    setLocationsText("");
    setMessage("Coffee shop added");
    notifyChange();
  }

  async function updateShop(
    shop: CoffeeShopRow,
    patch: {
      name?: string;
      website?: string;
      locationLabel?: LocationLabel;
      locationsText?: string;
      active?: boolean;
    },
  ) {
    const res = await fetch(`/api/admin/shops/${shop.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Update failed");
      return;
    }
    const updated = await res.json();
    setShops((list) =>
      sortShopsByName(
        list.map((s) =>
          s.id === updated.id
            ? {
                id: updated.id,
                name: updated.name,
                website: updated.website,
                locationLabel:
                  updated.locationLabel === "Locations"
                    ? "Locations"
                    : "Location",
                locations: parseLocationsJson(updated.locationsJson),
                sortOrder: updated.sortOrder,
                active: updated.active,
              }
            : s,
        ),
      ),
    );
    notifyChange();
  }

  async function removeShop(shop: CoffeeShopRow) {
    if (!confirm(`Delete "${shop.name}" from the map page?`)) return;
    const res = await fetch(`/api/admin/shops/${shop.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setShops((list) => sortShopsByName(list.filter((s) => s.id !== shop.id)));
    notifyChange();
  }

  const addForm = (
        <form onSubmit={handleAdd} className="space-y-2">
          <div
            className={
              isSidebar ? "grid gap-2" : "grid gap-3 sm:grid-cols-2"
            }
          >
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
              <label className="text-xs font-medium text-gray-600">
                Website URL
              </label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">
              Location label
            </label>
            <select
              value={locationLabel}
              onChange={(e) =>
                setLocationLabel(e.target.value as LocationLabel)
              }
              className={`${inputClass} max-w-xs`}
            >
              <option value="Location">Location (single)</option>
              <option value="Locations">Locations (multiple)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">
              Addresses (one per line)
            </label>
            <textarea
              required
              value={locationsText}
              onChange={(e) => setLocationsText(e.target.value)}
              rows={isSidebar ? 3 : 4}
              placeholder={"123 Main St.\nDenver, CO 80202"}
              className={`${inputClass} font-mono text-xs`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "Adding…" : "+ Add shop"}
          </button>
        </form>
  );

  const shopList =
    shops.length === 0 ? (
      <p className="text-xs text-gray-500">
        No shops yet. Add one above or import via{" "}
        <code className="text-[10px]">npm run db:seed</code>.
      </p>
    ) : (
      <ul className="divide-y divide-gray-100">
        {shops.map((shop) => (
          <ShopRowEditor
            key={shop.id}
            shop={shop}
            compact={isSidebar}
            onUpdate={updateShop}
            onRemove={removeShop}
          />
        ))}
      </ul>
    );

  if (isSidebar) {
    return (
      <div className="flex min-h-0 flex-col gap-3">
        <div className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            New shop
          </p>
          <div className="mt-2">{addForm}</div>
        </div>
        <div className="min-h-0 flex-1">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            All shops ({shops.length})
          </p>
          {shopList}
        </div>
        {message && (
          <p className="shrink-0 text-xs text-green-700" role="status">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        These shops appear as cards on the public{" "}
        <Link href="/map" className="text-brand-green hover:underline">
          Map & Coffee Shops
        </Link>{" "}
        page. Inactive shops are hidden from the site but kept here.
      </p>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Add coffee shop</h2>
        <div className="mt-4">{addForm}</div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          All shops ({shops.length})
        </h2>
        <div className="mt-4">{shopList}</div>
      </section>

      {message && (
        <p className="text-sm text-green-700" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function ShopRowEditor({
  shop,
  compact = false,
  onUpdate,
  onRemove,
}: {
  shop: CoffeeShopRow;
  compact?: boolean;
  onUpdate: (
    s: CoffeeShopRow,
    patch: {
      name?: string;
      website?: string;
      locationLabel?: LocationLabel;
      locationsText?: string;
      active?: boolean;
    },
  ) => void;
  onRemove: (s: CoffeeShopRow) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(shop.name);
  const [website, setWebsite] = useState(shop.website);
  const [locationLabel, setLocationLabel] = useState(shop.locationLabel);
  const [locationsText, setLocationsText] = useState(
    locationsToText(shop.locations),
  );

  async function save() {
    await onUpdate(shop, {
      name,
      website,
      locationLabel,
      locationsText,
    });
    setEditing(false);
  }

  if (!editing) {
    return (
      <li
        className={
          compact
            ? "rounded-lg border border-gray-100 bg-white py-3 pl-2 pr-1 shadow-sm"
            : "flex flex-wrap items-start justify-between gap-3 py-4"
        }
      >
        <div className={compact ? "min-w-0" : "min-w-0 flex-1"}>
          <p className={compact ? "text-sm font-medium text-gray-900" : "font-medium text-gray-900"}>
            {shop.name}
            {!shop.active && (
              <span className="ml-2 text-xs text-gray-400">(hidden)</span>
            )}
          </p>
          <p className={compact ? "mt-0.5 text-xs text-gray-600" : "mt-1 text-sm text-gray-600"}>
            {shop.locationLabel}: {shop.locations.length} line
            {shop.locations.length === 1 ? "" : "s"}
          </p>
          {shop.website && !compact && (
            <a
              href={shop.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate text-xs text-brand-green hover:underline"
            >
              {shop.website}
            </a>
          )}
        </div>
        <div
          className={
            compact
              ? "mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px]"
              : "flex flex-wrap gap-2 text-xs"
          }
        >
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-brand-green hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onUpdate(shop, { active: !shop.active })}
            className="text-gray-600 hover:underline"
          >
            {shop.active ? "Hide on site" : "Show on site"}
          </button>
          <button
            type="button"
            onClick={() => onRemove(shop)}
            className="text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={
        compact
          ? "my-2 space-y-2 rounded-lg border border-brand-green/40 bg-brand-green/5 p-2"
          : "space-y-2 border-l-2 border-brand-green py-4 pl-3"
      }
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
        placeholder="Shop name"
      />
      <input
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className={inputClass}
        placeholder="Website URL"
      />
      <select
        value={locationLabel}
        onChange={(e) => setLocationLabel(e.target.value as LocationLabel)}
        className={inputClass}
      >
        <option value="Location">Location</option>
        <option value="Locations">Locations</option>
      </select>
      <textarea
        value={locationsText}
        onChange={(e) => setLocationsText(e.target.value)}
        rows={4}
        className={`${inputClass} font-mono text-xs`}
      />
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={save}
          className="text-brand-green hover:underline"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-gray-500 hover:underline"
        >
          Cancel
        </button>
      </div>
    </li>
  );
}
