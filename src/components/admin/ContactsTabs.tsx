"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/settings/contacts", label: "Contacts", exact: true },
  { href: "/admin/settings/contacts/tags", label: "Tags", exact: false },
] as const;

export function ContactsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-gray-200">
      {TABS.map(({ href, label, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-brand-green text-brand-green"
                : "border-transparent text-gray-600 hover:text-brand-green"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
