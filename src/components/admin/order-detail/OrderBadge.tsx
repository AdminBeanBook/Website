import type { BadgeVariant } from "@/lib/orders/display";

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-900",
  warning: "bg-amber-100 text-amber-900",
  neutral: "bg-gray-100 text-gray-700",
  info: "bg-sky-100 text-sky-900",
};

type OrderBadgeProps = {
  label: string;
  variant: BadgeVariant;
};

export function OrderBadge({ label, variant }: OrderBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_CLASS[variant]}`}
    >
      {label}
    </span>
  );
}
