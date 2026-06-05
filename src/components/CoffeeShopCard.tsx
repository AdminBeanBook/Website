import type { CoffeeShopRow } from "@/lib/coffee-shops";
import {
  colorStyle,
  type PageTextColorsContext,
} from "@/lib/pages/text-colors";

export function CoffeeShopCard({
  shop,
  textColors,
}: {
  shop: CoffeeShopRow;
  textColors?: PageTextColorsContext;
}) {
  const label = shop.locationLabel ?? "Location";

  return (
    <article className="rounded-lg border border-brand-green/10 bg-white p-6 shadow-sm">
      <h3
        className="text-xl font-medium"
        style={textColors ? colorStyle("cardTitle", textColors) : undefined}
      >
        {shop.name}
      </h3>
      <p
        className="mt-3 text-sm font-medium opacity-70"
        style={textColors ? colorStyle("cardBody", textColors) : undefined}
      >
        {label}:
      </p>
      <ul className="mt-1 space-y-1 text-sm opacity-80">
        {shop.locations.map((loc) => (
          <li
            key={loc}
            style={textColors ? colorStyle("cardBody", textColors) : undefined}
          >
            {loc}
          </li>
        ))}
      </ul>
      {shop.website ? (
        <a
          href={shop.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium underline-offset-2 hover:underline"
          style={textColors ? colorStyle("cardLink", textColors) : undefined}
        >
          Check out their website!
        </a>
      ) : null}
    </article>
  );
}
