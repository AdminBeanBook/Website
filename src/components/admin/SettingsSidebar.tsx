"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isSettingsNavActive,
  SETTINGS_NAV,
} from "@/components/admin/settings-nav";

function linkClass(active: boolean): string {
  return active
    ? "bg-brand-green/10 font-medium text-brand-green"
    : "text-gray-700 hover:bg-gray-50 hover:text-brand-green";
}

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 lg:w-52">
      <nav
        className="rounded-xl border border-gray-200 bg-white py-2 shadow-sm"
        aria-label="Settings sections"
      >
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Settings
        </p>
        <ul>
          {SETTINGS_NAV.map((item) => {
            const active = isSettingsNavActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-4 py-2.5 text-sm ${linkClass(active)}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
