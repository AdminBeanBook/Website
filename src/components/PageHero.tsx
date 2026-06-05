import type { PageTextColorsContext } from "@/lib/pages/text-colors";
import { colorStyle } from "@/lib/pages/text-colors";

type PageHeroProps = {
  title: string;
  subtitle?: string;
  className?: string;
  textColors?: PageTextColorsContext;
};

export function PageHero({
  title,
  subtitle,
  className = "",
  textColors,
}: PageHeroProps) {
  return (
    <section className={`bg-brand-beige px-6 py-16 text-center ${className}`}>
      <h1
        className="whitespace-pre-line text-3xl font-light tracking-wide md:text-4xl"
        style={textColors ? colorStyle("heroTitle", textColors) : undefined}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="mx-auto mt-4 max-w-2xl whitespace-pre-line text-base leading-relaxed opacity-90"
          style={
            textColors ? colorStyle("heroSubtitle", textColors) : undefined
          }
        >
          {subtitle}
        </p>
      )}
    </section>
  );
}
