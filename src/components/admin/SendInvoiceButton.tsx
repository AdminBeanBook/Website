"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatMoney } from "@/lib/orders/display";

type InvoicePreview = {
  stripeInvoiceId: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  customerEmail: string | null;
  customerName: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  dueDate: string | null;
  lineItems: { description: string; amountCents: number }[];
  sent: boolean;
};

type SendInvoiceButtonProps = {
  orderId: string;
  invoiceHostedUrl?: string | null;
  invoiceSentAt?: string | null;
  compact?: boolean;
  autoOpenPreview?: boolean;
};

export function SendInvoiceButton({
  orderId,
  invoiceHostedUrl,
  invoiceSentAt,
  compact = false,
  autoOpenPreview = false,
}: SendInvoiceButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const alreadySent = Boolean(invoiceSentAt);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/send-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview" }),
      });
      const data = (await res.json()) as {
        error?: string;
        preview?: InvoicePreview;
      };
      if (!res.ok || !data.preview) {
        throw new Error(data.error ?? "Failed to load invoice preview");
      }
      setPreview(data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  function openPreview() {
    setOpen(true);
    void loadPreview();
  }

  useEffect(() => {
    if (autoOpenPreview && !alreadySent) {
      openPreview();
    }
    // Only on first mount when arriving from create-order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenPreview, alreadySent]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/send-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send invoice");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invoice");
      setSending(false);
    }
  }

  const btnClass = compact
    ? "rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
    : "rounded border border-brand-green px-3 py-1.5 text-sm font-medium text-brand-green hover:bg-brand-green hover:text-white disabled:opacity-60";

  return (
    <div>
      {alreadySent && invoiceHostedUrl ? (
        <div className="text-sm">
          <p className="text-gray-600">
            Invoice sent
            {invoiceSentAt
              ? ` ${new Date(invoiceSentAt).toLocaleDateString()}`
              : ""}
          </p>
          <a
            href={invoiceHostedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-green hover:underline"
          >
            View invoice in Stripe →
          </a>
        </div>
      ) : (
        <button type="button" onClick={openPreview} className={btnClass}>
          Preview invoice
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close invoice preview"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-preview-title"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
          >
            <div className="border-b border-gray-100 px-5 py-4">
              <h2
                id="invoice-preview-title"
                className="text-base font-semibold text-gray-900"
              >
                Invoice preview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                This has not been emailed yet. Review it, then send to the
                customer.
              </p>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
              {loading && (
                <p className="text-sm text-gray-500">Building invoice…</p>
              )}
              {error && (
                <p className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
              {preview && !loading && (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Bill to
                    </p>
                    {preview.customerName && (
                      <p className="font-medium text-gray-900">
                        {preview.customerName}
                      </p>
                    )}
                    <p className="text-gray-700">
                      {preview.customerEmail ?? "No email"}
                    </p>
                    {preview.dueDate && (
                      <p className="mt-1 text-gray-500">
                        Due {new Date(preview.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {preview.lineItems.map((line, i) => (
                      <li
                        key={`${line.description}-${i}`}
                        className="flex justify-between gap-4 px-3 py-2"
                      >
                        <span className="text-gray-700">{line.description}</span>
                        <span className="tabular-nums text-gray-900">
                          {formatMoney(line.amountCents)}
                        </span>
                      </li>
                    ))}
                    {preview.taxCents > 0 &&
                      preview.lineItems.reduce((sum, line) => sum + line.amountCents, 0) <
                        preview.totalCents && (
                        <li className="flex justify-between gap-4 px-3 py-2">
                          <span className="text-gray-700">Tax</span>
                          <span className="tabular-nums text-gray-900">
                            {formatMoney(preview.taxCents)}
                          </span>
                        </li>
                      )}
                    <li className="flex justify-between gap-4 px-3 py-2 font-semibold">
                      <span>Total due</span>
                      <span className="tabular-nums">
                        {formatMoney(preview.totalCents)}
                      </span>
                    </li>
                  </ul>

                  {preview.hostedInvoiceUrl && (
                    <a
                      href={preview.hostedInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-medium text-brand-green hover:underline"
                    >
                      Open full Stripe invoice →
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Close
              </button>
              {!alreadySent && (
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || loading || !preview}
                  className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send to customer"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
