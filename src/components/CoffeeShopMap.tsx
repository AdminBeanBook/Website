type CoffeeShopMapProps = {
  embedUrl?: string | null;
};

export function CoffeeShopMap({ embedUrl }: CoffeeShopMapProps) {
  const url = embedUrl?.trim();

  if (!url) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-dashed border-brand-green/30 bg-brand-cream/50 px-6 py-10 text-center text-sm text-brand-text/80">
        <p className="font-medium text-brand-text">Map not configured yet</p>
        <p className="mt-2">
          Add your Google My Maps embed URL as{" "}
          <code className="text-xs">GOOGLE_MAP_EMBED_URL</code> (or{" "}
          <code className="text-xs">NEXT_PUBLIC_GOOGLE_MAP_EMBED_URL</code>) in{" "}
          <code className="text-xs">.env.local</code> for local dev, and in{" "}
          <strong>Vercel → Settings → Environment Variables</strong> for the live
          site.
        </p>
        <p className="mt-2 text-xs">
          In Google Maps: open your map → Share → Embed a map → copy the{" "}
          <code className="text-xs">src</code> URL from the iframe code.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-lg border border-brand-green/20 shadow-md">
      <iframe
        title="Bean Book coffee shop map"
        src={url}
        className="h-[min(70vh,520px)] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
