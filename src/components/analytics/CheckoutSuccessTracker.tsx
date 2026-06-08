"use client";

import { useEffect, useRef } from "react";
import { trackPlausibleEvent } from "@/lib/analytics/plausible";

type CheckoutSuccessTrackerProps = {
  sessionId?: string;
};

export function CheckoutSuccessTracker({ sessionId }: CheckoutSuccessTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!sessionId || tracked.current) return;
    tracked.current = true;
    trackPlausibleEvent("Purchase", { product: "bean-book-2026" });
  }, [sessionId]);

  return null;
}
