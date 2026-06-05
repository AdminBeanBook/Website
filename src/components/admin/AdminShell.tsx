"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminNav } from "@/components/admin/AdminNav";

const WEBSITE_EDITOR_PATH = "/admin/settings/pages";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWebsiteEditor =
    pathname === WEBSITE_EDITOR_PATH ||
    pathname.startsWith(`${WEBSITE_EDITOR_PATH}/`);

  if (isWebsiteEditor) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-gray-100 text-gray-900">
        <header className="flex h-11 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/settings/admins"
              className="shrink-0 text-sm font-semibold text-brand-green"
            >
              Bean Book
            </Link>
            <span className="hidden text-gray-300 sm:inline">/</span>
            <Link
              href="/admin/settings/admins"
              className="hidden truncate text-sm text-gray-500 hover:text-brand-green sm:inline"
            >
              Settings
            </Link>
            <span className="text-sm font-medium text-gray-800">Website editor</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden text-xs text-gray-500 hover:underline sm:inline"
            >
              View site
            </Link>
            <AdminLogoutButton />
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-semibold text-brand-green">
              Bean Book Admin
            </Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:underline">
              View site
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
        <AdminMobileNav />
      </header>
      <main className="mx-auto max-w-[100rem] px-4 py-8">{children}</main>
    </div>
  );
}
