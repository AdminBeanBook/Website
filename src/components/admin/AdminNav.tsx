"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isSettingsAreaPath,
  SETTINGS_ENTRY_PATH,
} from "@/components/admin/settings-nav";

const MAIN_LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders", exact: false },
  { href: "/admin/email", label: "Email", exact: false },
  { href: "/admin/messages", label: "Messages", exact: false },
  { href: SETTINGS_ENTRY_PATH, label: "Settings", exact: false },
] as const;

function linkClass(active: boolean): string {
  return active
    ? "font-medium text-brand-green"
    : "text-gray-600 hover:text-brand-green";
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-4 text-sm md:flex" aria-label="Admin">
      {MAIN_LINKS.map(({ href, label, exact }) => {
        const active =
          href === SETTINGS_ENTRY_PATH
            ? isSettingsAreaPath(pathname)
            : exact
              ? pathname === href
              : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={linkClass(active)}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
