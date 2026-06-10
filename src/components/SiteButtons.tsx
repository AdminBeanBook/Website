"use client";

import { usePathname } from "next/navigation";
import { SiteButton } from "@/components/SiteButton";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { getSlotButtonsForPlacement } from "@/lib/site-config";
import { pathnameToPageSlug } from "@/lib/site-config/free-buttons";

type SiteButtonsProps = {
  placement: string;
  className?: string;
  wrapperClassName?: string;
};

export function SiteButtons({
  placement,
  className,
  wrapperClassName,
}: SiteButtonsProps) {
  const config = useSiteConfig();
  const pageSlug = pathnameToPageSlug(usePathname());
  const buttons = getSlotButtonsForPlacement(config, placement, pageSlug);

  if (buttons.length === 0) return null;

  return (
    <div className={wrapperClassName ?? "flex flex-wrap items-center gap-4"}>
      {buttons.map((button) => (
        <SiteButton
          key={button.id}
          button={button}
          className={className}
        />
      ))}
    </div>
  );
}
