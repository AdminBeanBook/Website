"use client";

import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";
import type { SiteButtonConfig } from "@/lib/site-config/types";

type SiteButtonProps = {
  button: SiteButtonConfig;
  className?: string;
  showDiscountField?: boolean;
};

export function SiteButton({
  button,
  className,
  showDiscountField = false,
}: SiteButtonProps) {
  const styleClass =
    button.style === "outline" ? "btn-outline" : "btn-primary";

  if (button.action === "checkout") {
    return (
      <BuyButton
        label={button.label}
        className={className ?? styleClass}
        showDiscountField={showDiscountField}
      />
    );
  }

  return (
    <Link href={button.href} className={className ?? styleClass}>
      {button.label}
    </Link>
  );
}
