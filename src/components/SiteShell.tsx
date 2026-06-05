"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageMainCanvas } from "@/components/PageMainCanvas";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isPreview = pathname === "/preview" || pathname.startsWith("/preview/");

  if (isAdmin || isPreview) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <PageMainCanvas>{children}</PageMainCanvas>
      <Footer />
    </>
  );
}
