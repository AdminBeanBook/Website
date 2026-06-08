import Script from "next/script";

const scriptSrc =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC?.trim() ||
  (process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim()
    ? "https://plausible.io/js/script.js"
    : undefined);

const legacyDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();

export function PlausibleScript() {
  if (!scriptSrc || process.env.NODE_ENV !== "production") {
    return null;
  }

  const usesLegacyScript = scriptSrc.endsWith("/js/script.js");

  return (
    <>
      <Script id="plausible-queue" strategy="beforeInteractive">
        {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)},window.plausible.init=window.plausible.init||function(i){window.plausible.o=i||{}},window.plausible.init()`}
      </Script>
      <Script
        async
        src={scriptSrc}
        strategy="afterInteractive"
        {...(usesLegacyScript && legacyDomain
          ? { "data-domain": legacyDomain }
          : {})}
      />
    </>
  );
}
