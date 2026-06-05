import Link from "next/link";
import type { OrderTab } from "@/lib/orders/status";
import { ORDER_TABS, isCreateTab, tabLabel } from "@/lib/orders/status";

type OrderTabsProps = {
  activeTab: OrderTab;
  counts: Record<OrderTab, number>;
};

export function OrderTabs({ activeTab, counts }: OrderTabsProps) {
  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-gray-200"
      aria-label="Order filters"
    >
      {ORDER_TABS.map((tab) => {
        const active = tab === activeTab;
        return (
          <Link
            key={tab}
            href={tab === "all" ? "/admin/orders" : `/admin/orders?tab=${tab}`}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              active
                ? "border-brand-green text-brand-green"
                : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
            }`}
          >
            {tabLabel(tab)}
            {!isCreateTab(tab) && (
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-brand-green/10 text-brand-green"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {counts[tab]}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
