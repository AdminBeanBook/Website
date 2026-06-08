declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

export function trackPlausibleEvent(
  event: string,
  props?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined") return;
  window.plausible?.(event, props ? { props } : undefined);
}
