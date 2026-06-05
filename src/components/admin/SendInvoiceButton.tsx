"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SendInvoiceButtonProps = {
  orderId: string;
  invoiceHostedUrl?: string | null;
  invoiceSentAt?: string | null;
  compact?: boolean;
};

export function SendInvoiceButton({
  orderId,
  invoiceHostedUrl,
  invoiceSentAt,
  compact = false,
}: SendInvoiceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (invoiceHostedUrl) {
    return (
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
    );
  }

  async function handleSend() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/send-invoice`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send invoice");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invoice");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className={
          compact
            ? "rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            : "rounded border border-brand-green px-3 py-1.5 text-sm font-medium text-brand-green hover:bg-brand-green hover:text-white disabled:opacity-60"
        }
      >
        {loading ? "Sending…" : "Send Stripe invoice"}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
