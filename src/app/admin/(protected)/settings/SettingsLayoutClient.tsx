"use client";

import { usePathname } from "next/navigation";
import { SettingsSidebar } from "@/components/admin/SettingsSidebar";

export function SettingsLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWebsiteEditor = pathname.startsWith("/admin/settings/pages");

  if (isWebsiteEditor) {
    return (
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <SettingsSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
