"use client";

import { useState } from "react";
import { trackPlausibleEvent } from "@/lib/analytics/plausible";

type BuyButtonProps = {
  label?: string;
  className?: string;
};

export function BuyButton({
  label = "Buy Now",
  className = "btn-primary",
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout");
      }

      trackPlausibleEvent("Checkout Started");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex w-full max-w-xs flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={`${className} w-full disabled:cursor-wait disabled:opacity-70`}
      >
        {loading ? "Redirecting to checkout…" : label}
      </button>
      {error && (
        <p className="max-w-xs text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
