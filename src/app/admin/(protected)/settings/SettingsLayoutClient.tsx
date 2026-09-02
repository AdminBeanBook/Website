"use client";

import { usePathname } from "next/navigation";

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

  return <div className="min-w-0">{children}</div>;
}
