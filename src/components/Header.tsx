"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ButtonPlacementZone } from "@/components/ButtonPlacementZone";
import { SiteButtons } from "@/components/SiteButtons";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { getEnabledNavLinks } from "@/lib/site-config";

export function Header() {
  const config = useSiteConfig();
  const navLinks = getEnabledNavLinks(config);
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/map?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/map");
    }
    setSearchOpen(false);
    setSearchQuery("");
  }

  return (
    <header className="sticky top-0 z-50 bg-brand-header text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <button
          type="button"
          className="md:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="sr-only">Menu</span>
          <svg className="h-6 w-6" viewBox="0 0 18 16" fill="currentColor">
            <path d="M1 .5a.5.5 0 100 1h15.71a.5.5 0 000-1H1zM.5 8a.5.5 0 01.5-.5h15.71a.5.5 0 010 1H1A.5.5 0 01.5 8zm0 7a.5.5 0 01.5-.5h15.71a.5.5 0 010 1H1a.5.5 0 01-.5-.5z" />
          </svg>
        </button>

        <Link href="/" className="shrink-0">
          <Image
            src={config.images.logo}
            alt={config.site.name}
            width={56}
            height={56}
            className="h-12 w-12 rounded-full bg-white object-contain p-1"
            priority
            unoptimized={config.images.logo.startsWith("/uploads/")}
          />
        </Link>

        <nav
          className={`${
            menuOpen ? "flex" : "hidden"
          } absolute left-0 right-0 top-full flex-col gap-1 border-t border-white/20 bg-brand-header px-4 py-4 md:static md:flex md:flex-1 md:flex-row md:items-center md:justify-center md:border-0 md:bg-transparent md:p-0`}
          aria-label="Main"
        >
          {navLinks.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 text-sm tracking-wide transition hover:opacity-90 ${
                  active ? "underline underline-offset-4" : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="p-1 hover:opacity-80"
            aria-label="Search coffee shops"
            onClick={() => setSearchOpen((o) => !o)}
          >
            <svg className="h-5 w-5" viewBox="0 0 18 19" fill="none" aria-hidden>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.03 11.68A5.784 5.784 0 112.85 3.5a5.784 5.784 0 018.18 8.18zm.26 1.12a6.78 6.78 0 11.72-.7l5.4 5.4a.5.5 0 11-.71.7l-5.41-5.4z"
                fill="currentColor"
              />
            </svg>
          </button>
          <ButtonPlacementZone placement="header" className="hidden sm:block">
            <SiteButtons
              placement="header"
              className="!px-4 !py-2 text-xs uppercase tracking-wide"
            />
          </ButtonPlacementZone>
        </div>
      </div>

      {searchOpen && (
        <form
          onSubmit={handleSearch}
          className="border-t border-white/20 px-4 py-3"
        >
          <div className="mx-auto flex max-w-md gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coffee shops"
              className="flex-1 rounded border-0 bg-white/10 px-3 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              type="submit"
              className="rounded bg-white px-4 py-2 text-sm text-brand-text"
            >
              Search
            </button>
          </div>
        </form>
      )}
    </header>
  );
}
