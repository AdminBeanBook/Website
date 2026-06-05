"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/email", label: "Compose", exact: true },
  { href: "/admin/email/templates", label: "Templates", exact: false },
] as const;

export function EmailTabs() {
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
