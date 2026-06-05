"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PackagePresetRow } from "@/components/admin/PackageManager";

type ShippingRate = {
  objectId: string;
  amount: string;
  currency: string;
  provider: string;
  service: string;
  estimatedDays: number | null;
  durationTerms: string | null;
};

type OrderShippingPanelProps = {
  orderId: string;
  hasShipTo: boolean;
  paymentPending?: boolean;
  shippoConfigured: boolean;
  shippoConfigMissing: string[];
  packages: PackagePresetRow[];
  defaultPackageId: string | null;
  packagePresetName: string | null;
  shippoShipmentId: string | null;
  labelUrl: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  carrierService: string | null;
  labelCostCents: number | null;
  shippedAt: string | null;
  /** When true, omit outer panel chrome (used inside fulfillment card). */
  embedded?: boolean;
};

function formatPackageOption(pkg: PackagePresetRow): string {
  return `${pkg.name} (${pkg.lengthIn}×${pkg.widthIn}×${pkg.heightIn} in, ${pkg.weightOz} oz)`;
}

export function OrderShippingPanel({
  orderId,
  hasShipTo,
  paymentPending = false,
  shippoConfigured,
  shippoConfigMissing,
  packages,
  defaultPackageId,
  packagePresetName,
  shippoShipmentId,
  labelUrl,
  trackingNumber,
  carrier,
  carrierService,
  labelCostCents,
  shippedAt,
  embedded = false,
}: OrderShippingPanelProps) {
  const router = useRouter();
  const [selectedPackageId, setSelectedPackageId] = useState(
    defaultPackageId ?? "",
  );
  const [loadingRates, setLoadingRates] = useState(false);
  const [buyingRateId, setBuyingRateId] = useState<string | null>(null);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [parcelSummary, setParcelSummary] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(shippoShipmentId);
  const [error, setError] = useState<string | null>(null);

  async function handleGetRates() {
    if (!selectedPackageId && packages.length > 0) {
      setError("Select a package first");
      return;
    }

    setLoadingRates(true);
    setError(null);
    setRates([]);
    setParcelSummary(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackageId || undefined,
        }),
      });
      const data = (await res.json()) as {
        rates?: ShippingRate[];
        shipmentId?: string;
        parcel?: { summary?: string };
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load rates");
      }

      setRates(data.rates ?? []);
      setShipmentId(data.shipmentId ?? null);
      setParcelSummary(data.parcel?.summary ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rates");
    } finally {
      setLoadingRates(false);
    }
  }

  async function handleBuyLabel(rate: ShippingRate) {
    setBuyingRateId(rate.objectId);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping/label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rateObjectId: rate.objectId,
          provider: rate.provider,
          service: rate.service,
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to buy label");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to buy label");
      setBuyingRateId(null);
    }
  }

  const panelClass = embedded
    ? "text-sm"
    : "mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm";

  if (labelUrl) {
    const labelClass = embedded
      ? "rounded-lg border border-green-200 bg-green-50 p-3 text-sm"
      : "mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm";
    return (
      <div className={labelClass}>
        <p className="font-medium text-green-900">Label purchased</p>
        {paymentPending && (
          <p className="mt-1 text-amber-800">
            Shipped — payment still unpaid. Mark as paid when you receive payment
            (moves to Archived if already shipped).
          </p>
        )}
        {packagePresetName && (
          <p className="mt-1 text-green-800">Package: {packagePresetName}</p>
        )}
        {carrier && (
          <p className="mt-1 text-green-800">
            Carrier: {carrier.toUpperCase()}
            {carrierService ? ` — ${carrierService}` : ""}
            {labelCostCents != null &&
              ` · Postage $${(labelCostCents / 100).toFixed(2)}`}
          </p>
        )}
        {trackingNumber && (
          <p className="mt-1 text-green-800">Tracking: {trackingNumber}</p>
        )}
        {shippedAt && (
          <p className="mt-1 text-green-700/80">
            Shipped {new Date(shippedAt).toLocaleString()}
          </p>
        )}
        <p className="mt-2 text-xs text-green-800/90">
          Labels are generated at <strong>4×6 inches</strong> for thermal printers.
          When printing, choose your label printer and set paper to 4×6 (not Letter).
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href={labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-green underline"
          >
            Open / print label (4×6)
          </a>
          <a
            href={labelUrl}
            download
            className="text-brand-green underline"
          >
            Download PDF
          </a>
          <a
            href="https://apps.goshippo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-green underline"
          >
            Open Shippo dashboard
          </a>
        </div>
        {shipmentId && (
          <p className="mt-2 text-xs text-green-700/70">
            Shippo shipment: {shipmentId}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-gray-800">
          {embedded ? "Create shipping label" : "Ship with Shippo"}
        </p>
        <div className="flex gap-3 text-xs">
          <Link href="/admin/settings/packages" className="text-brand-green hover:underline">
            Manage packages
          </Link>
          <a
            href="https://apps.goshippo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-green hover:underline"
          >
            Shippo dashboard →
          </a>
        </div>
      </div>

      {!shippoConfigured && (
        <p className="mt-2 text-amber-800">
          Shippo is not configured in <code className="text-xs">.env.local</code> (not{" "}
          <code className="text-xs">.env</code>). Missing or empty:{" "}
          <code className="text-xs">{shippoConfigMissing.join(", ")}</code>. Save the
          file and restart <code className="text-xs">npm run dev</code>, or create the
          label in the Shippo dashboard using this order&apos;s address.
        </p>
      )}

      {shippoConfigured && !hasShipTo && (
        <p className="mt-2 text-amber-800">
          Missing shipping address on this order. Use the Shippo dashboard if the
          customer address was collected elsewhere.
        </p>
      )}

      {shippoConfigured && hasShipTo && (
        <>
          {paymentPending && (
            <p className="mt-2 text-gray-600">
              Ship before payment — order stays on Unpaid until you mark it paid.
            </p>
          )}
          {packages.length === 0 ? (
            <p className="mt-2 text-amber-800">
              No package presets yet.{" "}
              <Link href="/admin/settings/packages" className="underline">
                Add a package
              </Link>{" "}
              or run <code className="text-xs">npm run db:seed</code> for the default
              mailer.
            </p>
          ) : (
            <div className="mt-3">
              <label htmlFor={`pkg-${orderId}`} className="mb-1 block text-sm font-medium">
                Package
              </label>
              <select
                id={`pkg-${orderId}`}
                value={selectedPackageId}
                onChange={(e) => {
                  setSelectedPackageId(e.target.value);
                  setRates([]);
                  setParcelSummary(null);
                }}
                className="w-full max-w-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {formatPackageOption(pkg)}
                    {pkg.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleGetRates}
            disabled={
              loadingRates ||
              buyingRateId !== null ||
              (packages.length > 0 && !selectedPackageId)
            }
            className={`mt-3 rounded px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60 ${
              embedded
                ? "bg-gray-900 hover:bg-gray-800"
                : "bg-brand-green"
            }`}
          >
            {loadingRates
              ? "Loading rates…"
              : embedded
                ? "Get rates & create label"
                : "Get shipping rates"}
          </button>

          {parcelSummary && (
            <p className="mt-2 text-gray-600">Rated as: {parcelSummary}</p>
          )}

          {rates.length > 0 && (
            <ul className="mt-4 space-y-2">
              {rates.map((rate) => (
                <li
                  key={rate.objectId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 bg-white px-3 py-2"
                >
                  <div>
                    <span className="font-medium">
                      {rate.provider.toUpperCase()} — {rate.service}
                    </span>
                    <span className="ml-2 text-gray-700">
                      ${Number(rate.amount).toFixed(2)} {rate.currency}
                    </span>
                    {rate.estimatedDays != null && (
                      <span className="ml-2 text-gray-500">
                        ~{rate.estimatedDays} day
                        {rate.estimatedDays === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuyLabel(rate)}
                    disabled={buyingRateId !== null}
                    className="rounded border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green hover:text-white disabled:opacity-60"
                  >
                    {buyingRateId === rate.objectId ? "Buying…" : "Buy label"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {error && (
        <p className="mt-3 text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
