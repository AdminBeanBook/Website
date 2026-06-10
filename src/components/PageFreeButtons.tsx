"use client";

import { usePathname } from "next/navigation";
import { SiteButton } from "@/components/SiteButton";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import {
  getButtonPagePosition,
  getFreeButtonsForPage,
  pathnameToPageSlug,
} from "@/lib/site-config/free-buttons";

export function PageFreeButtons() {
  const pathname = usePathname();
  const config = useSiteConfig();
  const pageSlug = pathnameToPageSlug(pathname);

  // Purchase page book card is the checkout control.
  if (pageSlug === "purchase") return null;

  const buttons = getFreeButtonsForPage(config, pageSlug);

  if (buttons.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-50"
      aria-hidden={false}
    >
      {buttons.map((button) => {
        const pos = getButtonPagePosition(button, pageSlug);
        if (!pos) return null;
        return (
          <div
            key={button.id}
            className="pointer-events-auto absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <SiteButton button={button} />
          </div>
        );
      })}
    </div>
  );
}
