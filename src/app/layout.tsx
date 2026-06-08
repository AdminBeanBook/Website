import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { SiteLayoutWrapper } from "@/components/SiteLayoutWrapper";
import { SiteShell } from "@/components/SiteShell";
import { SITE } from "@/lib/site";
import "./globals.css";

/** CMS content comes from the database — do not bake pages at deploy time. */
export const dynamic = "force-dynamic";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: SITE.name,
    template: `%s – ${SITE.name}`,
  },
  description: SITE.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans`}>
        <a
          href="#bb-page-canvas"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-brand-text"
        >
          Skip to content
        </a>
        <SiteLayoutWrapper variant="published">
          <SiteShell>{children}</SiteShell>
        </SiteLayoutWrapper>
      </body>
    </html>
  );
}
