"use client";

import Image from "next/image";
import { ContactForm } from "@/components/ContactForm";
import { CoffeeShopCard } from "@/components/CoffeeShopCard";
import { CoffeeShopMap } from "@/components/CoffeeShopMap";
import { SiteButton } from "@/components/SiteButton";
import { useCheckout } from "@/hooks/useCheckout";
import { SoWhatIsItArticle } from "@/components/pages/SoWhatIsItPageView";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import type { CoffeeShopRow } from "@/lib/coffee-shops";
import type { ResolvedPageContent } from "@/lib/pages";
import {
  getSectionBlocks,
  getTeamMembers,
  sectionButtonsToSiteButtons,
  type PageSection,
  type SectionBlock,
} from "@/lib/pages/sections";
import {
  colorStyle,
  type PageTextColorsContext,
} from "@/lib/pages/text-colors";

type PageSectionsViewProps = {
  page: ResolvedPageContent;
  sections: PageSection[];
  textColors: PageTextColorsContext;
  shops?: CoffeeShopRow[];
  mapEmbedUrl?: string | null;
  editMode?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (id: string) => void;
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function SectionFrame({
  section,
  editMode,
  selected,
  onSelect,
  children,
}: {
  section: PageSection;
  editMode: boolean;
  selected: boolean;
  onSelect?: (id: string) => void;
  children: React.ReactNode;
}) {
  if (!editMode) return <>{children}</>;

  return (
    <div
      data-bb-section={section.id}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect?.(section.id);
      }}
      className={`relative cursor-pointer ${
        selected
          ? "outline outline-2 outline-sky-500 outline-offset-[-2px]"
          : "hover:outline hover:outline-2 hover:outline-sky-300 hover:outline-offset-[-2px]"
      }`}
    >
      <span className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
        {section.type.replace("-", " ")}
      </span>
      <div className="pointer-events-none">{children}</div>
    </div>
  );
}

function SectionButtonFromBlock({ block }: { block: SectionBlock }) {
  const [button] = sectionButtonsToSiteButtons([
    {
      id: block.id,
      label: asString(block.settings.label, "Button"),
      href: asString(block.settings.href, "/"),
      style: block.settings.style === "outline" ? "outline" : "primary",
      action: block.settings.action === "checkout" ? "checkout" : "link",
    },
  ]);
  return (
    <div className="mt-6 flex justify-center">
      <SiteButton button={button} />
    </div>
  );
}

function ContentBlocks({
  section,
  headingStyle,
  textStyle,
  headingClassName,
}: {
  section: PageSection;
  headingStyle: React.CSSProperties;
  textStyle: React.CSSProperties;
  headingClassName?: string;
}) {
  const blocks = getSectionBlocks(section);
  return (
    <>
      {blocks.map((block) => {
        if (block.type === "heading") {
          const text = asString(block.settings.text);
          if (!text) return null;
          return (
            <h2
              key={block.id}
              className={
                headingClassName ??
                "whitespace-pre-line text-2xl font-light tracking-wide md:text-3xl lg:text-4xl"
              }
              style={headingStyle}
            >
              {text}
            </h2>
          );
        }
        if (block.type === "text") {
          const text = asString(block.settings.text);
          if (!text) return null;
          return (
            <p
              key={block.id}
              className="prose-bb mt-6 whitespace-pre-line"
              style={textStyle}
            >
              {text}
            </p>
          );
        }
        return <SectionButtonFromBlock key={block.id} block={block} />;
      })}
    </>
  );
}

function HeroSection({
  section,
  textColors,
}: {
  section: PageSection;
  textColors: PageTextColorsContext;
}) {
  const backgroundImage = asString(section.settings.backgroundImage);
  const headingStyle = colorStyle("heroTitle", textColors);
  const textStyle = colorStyle("heroSubtitle", textColors);
  const inner = (
    <ContentBlocks
      section={section}
      headingStyle={headingStyle}
      textStyle={textStyle}
    />
  );

  if (backgroundImage) {
    return (
      <section className="relative min-h-[70vh] bg-brand-beige md:min-h-[85vh]">
        <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center md:min-h-[85vh]">
          <div className="max-w-2xl">{inner}</div>
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover object-right-bottom opacity-90"
            priority
            sizes="100vw"
            unoptimized={backgroundImage.startsWith("/uploads/")}
          />
          <div className="absolute inset-0 bg-brand-beige/40" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-brand-beige px-6 py-16 text-center">
      <div className="mx-auto max-w-2xl">{inner}</div>
    </section>
  );
}

function RichTextSection({
  section,
  textColors,
}: {
  section: PageSection;
  textColors: PageTextColorsContext;
}) {
  return (
    <section className="relative bg-white px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <ContentBlocks
          section={section}
          headingStyle={colorStyle("sectionTitle", textColors)}
          textStyle={colorStyle("sectionBody", textColors)}
          headingClassName="page-heading whitespace-pre-line"
        />
      </div>
    </section>
  );
}

function GallerySection({ section }: { section: PageSection }) {
  const images = Array.isArray(section.settings.images)
    ? section.settings.images.map((src) => String(src ?? "")).filter(Boolean)
    : [];
  if (images.length === 0) return null;

  return (
    <section className="bg-brand-cream px-6 py-12">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative aspect-square overflow-hidden rounded-lg shadow-md"
          >
            <Image
              src={src}
              alt={`Gallery ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
              unoptimized={src.startsWith("/uploads/")}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaSection({ section, textColors }: { section: PageSection; textColors: PageTextColorsContext }) {
  return (
    <section className="bg-white px-6 py-12">
      <div className="mx-auto max-w-3xl text-center">
        <ContentBlocks
          section={section}
          headingStyle={colorStyle("sectionTitle", textColors)}
          textStyle={colorStyle("sectionBody", textColors)}
          headingClassName="page-heading whitespace-pre-line"
        />
      </div>
    </section>
  );
}

function ProductSection({
  section,
  textColors,
}: {
  section: PageSection;
  textColors: PageTextColorsContext;
}) {
  const config = useSiteConfig();
  const { startCheckout, loading, error } = useCheckout();
  const image = asString(section.settings.image) || config.images.productCover;
  const title = asString(section.settings.title, "Bean Book: 2026 Edition");
  const priceLabel = asString(section.settings.priceLabel, "$25.00 USD");
  const finePrint = asString(section.settings.finePrint);

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-sm">
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading}
          aria-label={`Buy ${title}`}
          className="group block w-full text-center disabled:cursor-wait disabled:opacity-80"
        >
          <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg bg-brand-cream shadow-lg transition group-hover:shadow-xl group-disabled:group-hover:shadow-lg">
            <Image
              src={image}
              alt=""
              fill
              className="object-contain p-4"
              sizes="320px"
              unoptimized={image.startsWith("/uploads/")}
            />
          </div>
          <h2
            className="mt-6 text-xl font-medium"
            style={colorStyle("productTitle", textColors)}
          >
            {title}
          </h2>
          <p
            className="mt-2 text-lg opacity-80"
            style={colorStyle("productPrice", textColors)}
          >
            {priceLabel}
          </p>
          {loading && (
            <p className="mt-3 text-sm opacity-70">Redirecting to checkout…</p>
          )}
        </button>
        {error && (
          <p className="mt-4 text-center text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {finePrint ? (
          <p
            className="mt-10 text-center text-xs opacity-60"
            style={colorStyle("finePrint", textColors)}
          >
            {finePrint}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ShopDirectorySection({
  section,
  shops,
  textColors,
  mapEmbedUrl,
}: {
  section: PageSection;
  shops: CoffeeShopRow[];
  textColors: PageTextColorsContext;
  mapEmbedUrl?: string | null;
}) {
  const heading = asString(section.settings.heading, "2026 Map");
  const subtext = asString(section.settings.subtext, "Denver Metro Shops");

  return (
    <section className="px-6 py-12">
      <h2 className="page-heading mb-2" style={colorStyle("sectionHeading", textColors)}>
        {heading}
      </h2>
      {subtext ? (
        <p
          className="mb-6 text-center opacity-80"
          style={colorStyle("sectionSubtext", textColors)}
        >
          {subtext}
        </p>
      ) : null}
      <div className="mb-12">
        <CoffeeShopMap embedUrl={mapEmbedUrl} />
      </div>
      {shops.length === 0 ? (
        <p
          className="text-center opacity-70"
          style={colorStyle("sectionSubtext", textColors)}
        >
          No coffee shops match your search.
        </p>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <CoffeeShopCard key={shop.id} shop={shop} textColors={textColors} />
          ))}
        </div>
      )}
    </section>
  );
}

function TeamSection({
  section,
  textColors,
}: {
  section: PageSection;
  textColors: PageTextColorsContext;
}) {
  const members = getTeamMembers(section);

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-20">
        {members.map((member, index) => (
          <article key={`${member.name}-${index}`} className="text-center">
            {member.image ? (
              <div className="relative mx-auto mb-6 h-40 w-40 overflow-hidden rounded-full bg-brand-cream">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
            ) : null}
            <h2
              className="text-2xl font-light"
              style={colorStyle("memberName", textColors)}
            >
              {member.name}
            </h2>
            <div
              className="prose-bb mt-6 text-left"
              style={colorStyle("memberBio", textColors)}
            >
              {member.bio.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
              {member.coffee ? <p className="italic">{member.coffee}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function renderSectionBody(
  section: PageSection,
  props: PageSectionsViewProps,
) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} textColors={props.textColors} />;
    case "rich-text":
      return <RichTextSection section={section} textColors={props.textColors} />;
    case "gallery":
      return <GallerySection section={section} />;
    case "cta":
      return <CtaSection section={section} textColors={props.textColors} />;
    case "product":
      return <ProductSection section={section} textColors={props.textColors} />;
    case "contact-form":
      return (
        <section className="px-6 py-16">
          <ContactForm />
        </section>
      );
    case "shop-directory":
      return (
        <ShopDirectorySection
          section={section}
          shops={props.shops ?? []}
          textColors={props.textColors}
          mapEmbedUrl={props.mapEmbedUrl}
        />
      );
    case "team":
      return <TeamSection section={section} textColors={props.textColors} />;
    case "about":
      return <SoWhatIsItArticle textColors={props.textColors} />;
  }
}

export function PageSectionsView(props: PageSectionsViewProps) {
  const {
    sections,
    editMode = false,
    selectedSectionId,
    onSelectSection,
  } = props;

  return (
    <>
      {sections
        .filter((section) => editMode || section.enabled)
        .map((section) => (
          <SectionFrame
            key={section.id}
            section={section}
            editMode={editMode}
            selected={selectedSectionId === section.id}
            onSelect={onSelectSection}
          >
            <div className={section.enabled ? "" : "opacity-50"}>
              {renderSectionBody(section, props)}
            </div>
          </SectionFrame>
        ))}
    </>
  );
}
