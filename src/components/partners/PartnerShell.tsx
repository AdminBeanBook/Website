"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function PartnerShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/partners/logout", { method: "POST" });
    router.push("/partners/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#FBF6ED] text-[#2C1A0E]">
      <header className="border-b border-[#2C1A0E]/10 bg-[#2C1A0E] text-[#F5EFE0]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link href="/partners" className="text-lg font-semibold">
              Bean Book · Shop portal
            </Link>
            <p className="text-xs text-[#F5EFE0]/70">{email}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="text-sm text-[#D4A847] hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
