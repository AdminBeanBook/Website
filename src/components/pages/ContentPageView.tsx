import { PageHero } from "@/components/PageHero";
import type { ResolvedPageContent } from "@/lib/pages";
import {
  colorStyle,
  type PageTextColorsContext,
} from "@/lib/pages/text-colors";

type ContentPageViewProps = {
  page: ResolvedPageContent;
  textColors: PageTextColorsContext;
};

export function ContentPageView({ page, textColors }: ContentPageViewProps) {
  const paragraphs = page.body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <PageHero
        title={page.title}
        subtitle={page.subtitle ?? undefined}
        textColors={textColors}
      />
      <section className="px-6 py-16">
        <div className="prose-bb mx-auto max-w-3xl" style={colorStyle("body", textColors)}>
          {paragraphs.length > 0 ? (
            paragraphs.map((text) => (
              <p key={text.slice(0, 40)} className="whitespace-pre-line">
                {text}
              </p>
            ))
          ) : (
            <p className="opacity-60">Add body content in the page editor.</p>
          )}
        </div>
      </section>
    </>
  );
}
