"use client";

import { useEffect, useRef } from "react";
import { trackPlausibleEvent } from "@/lib/analytics/plausible";

type CheckoutSuccessTrackerProps = {
  sessionId?: string;
  productId?: string;
};

export function CheckoutSuccessTracker({
  sessionId,
  productId,
}: CheckoutSuccessTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!sessionId || tracked.current) return;
    tracked.current = true;
    trackPlausibleEvent("Purchase", {
      product: productId ?? "bean-book-2026-edition",
    });
  }, [sessionId, productId]);

  return null;
}
