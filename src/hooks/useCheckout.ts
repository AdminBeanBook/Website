"use client";

import { useCallback, useState } from "react";
import { trackPlausibleEvent } from "@/lib/analytics/plausible";

export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
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
  }, []);

  return { startCheckout, loading, error };
}
