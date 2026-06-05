"use client";

import Link from "next/link";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { getEnabledNavLinks } from "@/lib/site-config";

export function Footer() {
  const config = useSiteConfig();
  const navLinks = getEnabledNavLinks(config);

  return (
    <footer className="border-t border-brand-green/10 bg-brand-cream text-brand-text">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <h2 className="mb-4 text-lg font-medium">Quick Links</h2>
          <ul className="space-y-2 text-sm capitalize">
            <li>
              <Link href="/map" className="hover:underline">
                search
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                contact us
              </Link>
            </li>
            <li>
              <Link href="/purchase" className="hover:underline">
                buy now
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="hover:underline">
                sign in
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-medium">Join the Bean Buddies:</h2>
          <p className="mb-4 text-sm">Follow us on Facebook and Instagram!</p>
          <ul className="flex gap-4">
            <li>
              <a
                href={config.site.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href={config.site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="font-medium">{config.site.name}</p>
          <nav className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-brand-text/70">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:underline">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-brand-green/10 py-4 text-center text-xs text-brand-text/60">
        <p>
          © {new Date().getFullYear()} {config.site.name}. Denver coffee passbook.
        </p>
      </div>
    </footer>
  );
}
