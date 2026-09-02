"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_MAIN_NAV, isAdminMainNavActive } from "@/components/admin/admin-nav";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import {
  isSettingsNavActive,
  SETTINGS_NAV,
} from "@/components/admin/settings-nav";

function itemClass(active: boolean): string {
  return active
    ? "bg-white font-medium text-gray-900 shadow-sm"
    : "text-gray-700 hover:bg-black/[0.04]";
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M10 3.2 3.5 8.4v8.1h4.3v-4.6h4.4v4.6h4.3V8.4L10 3.2Zm0-1.7 8 6.4v10.6H11.2v-4.6H8.8v4.6H2V7.9l8-6.4Z"
      />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M4.5 2.75h11A1.75 1.75 0 0 1 17.25 4.5v11a1.75 1.75 0 0 1-1.75 1.75h-11A1.75 1.75 0 0 1 2.75 15.5v-11A1.75 1.75 0 0 1 4.5 2.75Zm0 1.5a.25.25 0 0 0-.25.25v11c0 .14.11.25.25.25h11a.25.25 0 0 0 .25-.25v-11a.25.25 0 0 0-.25-.25h-11ZM6 6.5h8v1.5H6V6.5Zm0 3.5h8v1.5H6V10Zm0 3.5h5V15H6v-1.5Z"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M3.5 4.25h13A1.75 1.75 0 0 1 18.25 6v8a1.75 1.75 0 0 1-1.75 1.75h-13A1.75 1.75 0 0 1 1.75 14V6A1.75 1.75 0 0 1 3.5 4.25Zm0 1.5a.25.25 0 0 0-.25.25v.38l6.75 4.22 6.75-4.22V6a.25.25 0 0 0-.25-.25h-13Zm13.25 2.12-6.4 4a.75.75 0 0 1-.8 0l-6.4-4V14c0 .14.11.25.25.25h13a.25.25 0 0 0 .25-.25V7.87Z"
      />
    </svg>
  );
}

function MessagesIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M10 2.75A7.25 7.25 0 0 0 2.75 10c0 1.47.44 2.84 1.2 3.97L3 17.25l3.45-.9A7.22 7.22 0 0 0 10 17.25 7.25 7.25 0 0 0 10 2.75Zm0 1.5A5.75 5.75 0 1 1 10 15.75a5.72 5.72 0 0 1-2.68-.66l-.32-.16-1.86.48.5-1.8-.17-.34A5.73 5.73 0 0 1 4.25 10 5.75 5.75 0 0 1 10 4.25Z"
      />
    </svg>
  );
}

function LinksIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M8.1 12.9a.75.75 0 0 1 0-1.06l3.04-3.04a.75.75 0 1 1 1.06 1.06L9.16 12.9a.75.75 0 0 1-1.06 0Zm-2.22.88a2.5 2.5 0 0 1 0-3.54l1.2-1.2a.75.75 0 1 1 1.06 1.06l-1.2 1.2a1 1 0 1 0 1.42 1.42l1.2-1.2a.75.75 0 0 1 1.06 1.06l-1.2 1.2a2.5 2.5 0 0 1-3.54 0Zm6.36-6.36a.75.75 0 0 1 0-1.06l1.2-1.2a2.5 2.5 0 0 1 3.54 3.54l-1.2 1.2a.75.75 0 1 1-1.06-1.06l1.2-1.2a1 1 0 1 0-1.42-1.42l-1.2 1.2a.75.75 0 0 1-1.06 0Z"
      />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M3.75 3.5h10.5A1.75 1.75 0 0 1 16 5.25v9.5A1.75 1.75 0 0 1 14.25 16.5H3.75A1.75 1.75 0 0 1 2 14.75v-9.5A1.75 1.75 0 0 1 3.75 3.5Zm0 1.5a.25.25 0 0 0-.25.25v9.5c0 .14.11.25.25.25h10.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25H3.75ZM17.25 5.5h.5v9h-.5v-9ZM9 6.75a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM6.4 12.6c.66-1.08 1.57-1.6 2.6-1.6s1.94.52 2.6 1.6a.75.75 0 0 1-1.28.8c-.4-.64-.86-.9-1.32-.9s-.92.26-1.32.9a.75.75 0 0 1-1.28-.8Z"
      />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M10 2.75a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 1.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM4.4 15.35C5.55 13.6 7.5 12.5 10 12.5s4.45 1.1 5.6 2.85A.75.75 0 0 1 14.35 16C13.5 14.7 12 13.99 10 13.99s-3.5.71-4.35 2.01a.75.75 0 1 1-1.25-.65Z"
      />
    </svg>
  );
}

const MAIN_ICONS = {
  "/admin": HomeIcon,
  "/admin/orders": OrdersIcon,
  "/admin/email": EmailIcon,
  "/admin/messages": MessagesIcon,
  "/admin/settings/links": LinksIcon,
  "/admin/settings/contacts": ContactsIcon,
  "/admin/settings/customers": CustomersIcon,
} as const;

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-3 pt-4">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="block rounded-lg px-2 py-1.5 hover:bg-black/[0.04]"
        >
          <p className="text-sm font-semibold text-gray-900">Bean Book</p>
          <p className="text-xs text-gray-500">Admin</p>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" aria-label="Admin">
        <ul className="space-y-0.5">
          {ADMIN_MAIN_NAV.map((item) => {
            const Icon = MAIN_ICONS[item.href];
            const active = isAdminMainNavActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] ${itemClass(active)}`}
                >
                  <Icon />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="px-2 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Settings
        </p>
        <ul className="space-y-0.5">
          {SETTINGS_NAV.map((item) => {
            const active = isSettingsNavActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-lg px-2 py-1.5 pl-9 text-[13px] ${itemClass(active)}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-1 border-t border-black/5 px-3 py-3">
        <Link
          href="/"
          target="_blank"
          className="block rounded-lg px-2 py-1.5 text-[13px] text-gray-600 hover:bg-black/[0.04] hover:text-gray-900"
        >
          View site
        </Link>
        <AdminLogoutButton className="block w-full rounded-lg px-2 py-1.5 text-left text-[13px] text-gray-600 hover:bg-black/[0.04] hover:text-red-700" />
      </div>
    </div>
  );
}

type AdminSidebarProps = {
  variant?: "static" | "drawer";
  onClose?: () => void;
};

export function AdminSidebar({
  variant = "static",
  onClose,
}: AdminSidebarProps) {
  const panel = (
    <div className="flex h-full w-[15.5rem] shrink-0 flex-col bg-[#f1f1f1]">
      <SidebarBody onNavigate={variant === "drawer" ? onClose : undefined} />
    </div>
  );

  if (variant === "drawer") {
    return (
      <div className="fixed inset-0 z-50">
        <button
          type="button"
          className="absolute inset-0 bg-black/30"
          aria-label="Close menu"
          onClick={onClose}
        />
        <div className="relative z-10 h-full shadow-xl">{panel}</div>
      </div>
    );
  }

  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 border-r border-black/[0.06] md:block">{panel}</aside>
  );
}

export function AdminMenuButton({
  onClick,
  className = "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-700 hover:bg-black/[0.06] md:hidden",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label="Open admin menu"
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
        <path
          fill="currentColor"
          d="M3.25 4.75h13.5v1.5H3.25v-1.5Zm0 4.5h13.5v1.5H3.25v-1.5Zm0 4.5h13.5v1.5H3.25v-1.5Z"
        />
      </svg>
    </button>
  );
}
