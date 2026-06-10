"use client";

import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";
import type { SiteButtonConfig } from "@/lib/site-config/types";

type SiteButtonProps = {
  button: SiteButtonConfig;
  className?: string;
};

export function SiteButton({ button, className }: SiteButtonProps) {
  const styleClass =
    button.style === "outline" ? "btn-outline" : "btn-primary";

  if (button.action === "checkout") {
    return (
      <BuyButton label={button.label} className={className ?? styleClass} />
    );
  }

  return (
    <Link href={button.href} className={className ?? styleClass}>
      {button.label}
    </Link>
  );
}
