"use client";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageSectionsView } from "@/components/pages/PageSectionsView";
import { SiteConfigProvider } from "@/components/SiteConfigProvider";
import { SiteThemeStyles } from "@/components/SiteThemeStyles";
import type { CoffeeShopRow } from "@/lib/coffee-shops";
import type { ResolvedPageContent } from "@/lib/pages";
import type { PageSection } from "@/lib/pages/sections";
import { buildPageTextColorsContext } from "@/lib/pages/text-colors";
import type { SiteConfig } from "@/lib/site-config";

type EditorCanvasProps = {
  siteConfig: SiteConfig;
  page: ResolvedPageContent;
  sections: PageSection[];
  shops: CoffeeShopRow[];
  mapEmbedUrl: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function EditorCanvas({
  siteConfig,
  page,
  sections,
  shops,
  mapEmbedUrl,
  selectedId,
  onSelect,
}: EditorCanvasProps) {
  const textColors = buildPageTextColorsContext(
    page.template,
    page.textColorOverrides,
    siteConfig.colors.text,
  );

  return (
    <div className="absolute inset-0 overflow-auto bg-neutral-300 p-4">
      <div
        className="bb-editor-preview mx-auto min-h-full max-w-5xl overflow-hidden bg-white shadow-xl"
        onClickCapture={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("a, button")) {
            e.preventDefault();
          }
        }}
      >
        <SiteConfigProvider config={siteConfig}>
          <SiteThemeStyles colors={siteConfig.colors} selector=".bb-editor-preview" />
          <div
            data-bb-section="__header"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect("__header");
            }}
            className={`relative cursor-pointer ${
              selectedId === "__header"
                ? "outline outline-2 outline-sky-500 outline-offset-[-2px]"
                : "hover:outline hover:outline-2 hover:outline-sky-300 hover:outline-offset-[-2px]"
            }`}
          >
            {selectedId === "__header" ? (
              <span className="absolute left-2 top-2 z-[60] rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                Header
              </span>
            ) : null}
            <div className="pointer-events-none">
              <Header />
            </div>
          </div>
          <PageSectionsView
            page={page}
            sections={sections}
            textColors={textColors}
            shops={shops}
            mapEmbedUrl={mapEmbedUrl}
            editMode
            selectedSectionId={selectedId}
            onSelectSection={onSelect}
          />
          <div
            data-bb-section="__footer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect("__footer");
            }}
            className={`relative cursor-pointer ${
              selectedId === "__footer"
                ? "outline outline-2 outline-sky-500 outline-offset-[-2px]"
                : "hover:outline hover:outline-2 hover:outline-sky-300 hover:outline-offset-[-2px]"
            }`}
          >
            <div className="pointer-events-none">
              <Footer />
            </div>
          </div>
        </SiteConfigProvider>
      </div>
    </div>
  );
}
