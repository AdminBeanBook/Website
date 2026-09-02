"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminMenuButton,
  AdminSidebar,
} from "@/components/admin/AdminSidebar";

const WEBSITE_EDITOR_PATH = "/admin/settings/pages";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isWebsiteEditor =
    pathname === WEBSITE_EDITOR_PATH ||
    pathname.startsWith(`${WEBSITE_EDITOR_PATH}/`);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  if (isWebsiteEditor) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-gray-100 text-gray-900">
        {mobileOpen ? (
          <AdminSidebar variant="drawer" onClose={() => setMobileOpen(false)} />
        ) : null}
        <header className="flex h-11 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-3">
          <div className="flex min-w-0 items-center gap-3">
            <AdminMenuButton
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-700 hover:bg-black/[0.06]"
            />
            <Link
              href="/admin"
              className="shrink-0 text-sm font-semibold text-gray-900"
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
            <span className="text-sm font-medium text-gray-800">
              Website editor
            </span>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-[#f1f1f1] text-gray-900">
      <AdminSidebar />
      {mobileOpen ? (
        <AdminSidebar variant="drawer" onClose={() => setMobileOpen(false)} />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 px-3 md:hidden">
          <AdminMenuButton onClick={() => setMobileOpen(true)} />
          <Link href="/admin" className="text-sm font-semibold text-gray-900">
            Bean Book
          </Link>
        </header>
        <main className="mx-auto w-full max-w-[100rem] flex-1 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
