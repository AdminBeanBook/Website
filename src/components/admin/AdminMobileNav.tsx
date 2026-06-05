"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isSettingsAreaPath,
  SETTINGS_ENTRY_PATH,
} from "@/components/admin/settings-nav";

const MAIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/email", label: "Email" },
  { href: "/admin/messages", label: "Messages" },
  { href: SETTINGS_ENTRY_PATH, label: "Settings" },
] as const;

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-x-3 gap-y-2 border-t border-gray-100 px-4 py-3 text-sm md:hidden"
      aria-label="Admin mobile"
    >
      {MAIN_LINKS.map(({ href, label }) => {
        const active =
          href === SETTINGS_ENTRY_PATH
            ? isSettingsAreaPath(pathname)
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={
              active ? "font-medium text-brand-green" : "text-gray-600"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
