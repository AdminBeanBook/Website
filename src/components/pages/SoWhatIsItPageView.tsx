import { BuyButton } from "@/components/BuyButton";
import { PageHero } from "@/components/PageHero";
import type { ResolvedPageContent } from "@/lib/pages";
import {
  colorStyle,
  type PageTextColorsContext,
} from "@/lib/pages/text-colors";

type SoWhatIsItPageViewProps = {
  page: ResolvedPageContent;
  textColors: PageTextColorsContext;
};

const sectionHeadingClass = "!mt-12 text-center text-2xl font-light";

export function SoWhatIsItPageView({ page, textColors }: SoWhatIsItPageViewProps) {
  const headingStyle = colorStyle("sectionHeading", textColors);

  return (
    <>
      <PageHero
        title={page.title}
        subtitle={page.subtitle ?? undefined}
        textColors={textColors}
      />

      <section className="px-6 py-16">
        <div className="prose-bb" style={colorStyle("body", textColors)}>
          <p>
            The Bean Book is a Denver coffee passbook that goes beyond being
            just a guide; it&apos;s a gateway to discovering the best coffee
            experiences Denver and its surrounding areas have to offer. Created
            with the coffee enthusiast in mind, The Bean Book serves as a bridge
            between coffee lovers and local coffee creators, offering a unique way
            to explore the vibrant coffee scene while supporting small
            businesses.
          </p>

          <h2 className={sectionHeadingClass} style={headingStyle}>
            What Makes The Bean Book Unique?
          </h2>

          <ol className="!mt-6 list-decimal space-y-4 pl-6">
            <li>
              <strong>27 Featured Coffee Shops:</strong> By purchasing The Bean
              Book, you gain access to exclusive discounts at 27 handpicked coffee
              shops across Denver. These discounts are valid throughout the year,
              making it the perfect companion for your coffee adventures.
            </li>
            <li>
              <strong>Comprehensive Information:</strong> Each featured coffee
              shop is accompanied by essential details, including addresses,
              websites, and highlights from their menu. This makes it easy for
              you to plan your visits and explore new coffee spots effortlessly.
            </li>
            <li>
              <strong>Exclusive Discounts:</strong> The Bean Book allows you to
              enjoy premium coffee experiences at a fraction of the cost,
              encouraging you to try new places and perhaps find your new
              favorite coffee shop.
            </li>
            <li>
              <strong>Journaling and Reflection:</strong> More than just a
              passbook, The Bean Book includes dedicated journal pages. Use these
              pages to jot down notes about your visits, reflect on your favorite
              flavors, or highlight memorable moments from your coffee
              explorations.
            </li>
          </ol>

          <h2 className={sectionHeadingClass} style={headingStyle}>
            Who Is The Bean Book For?
          </h2>
          <p className="!mt-6">The Bean Book is perfect for:</p>
          <ul className="!mt-4 list-disc space-y-2 pl-6">
            <li>
              <strong>Coffee Enthusiasts:</strong> Whether you&apos;re a seasoned
              coffee aficionado or just starting to explore the world of specialty
              coffee, The Bean Book offers a curated experience.
            </li>
            <li>
              <strong>Adventurers:</strong> If you love discovering hidden gems
              and exploring local businesses, this passbook is your ultimate
              guide.
            </li>
            <li>
              <strong>Gift Givers:</strong> Looking for a thoughtful and unique
              gift? The Bean Book is ideal for anyone who loves coffee and
              meaningful experiences.
            </li>
            <li>
              <strong>Supporters of Local Businesses:</strong> By purchasing The
              Bean Book, you&apos;re helping to support Denver&apos;s thriving local
              coffee community.
            </li>
          </ul>

          <h2 className={sectionHeadingClass} style={headingStyle}>
            Why You&apos;ll Love The Bean Book
          </h2>
          <p className="!mt-6">
            The Bean Book is more than just discounts and deals; it&apos;s a
            celebration of coffee culture. Each page is crafted to help you
            immerse yourself in the Denver coffee scene, encouraging you to step
            out of your comfort zone and discover something new. With its
            thoughtfully curated coffee shop listings and space for journaling,
            The Bean Book turns every coffee outing into a memorable experience.
          </p>

          <h2 className={sectionHeadingClass} style={headingStyle}>
            The Bean Book&apos;s Mission
          </h2>
          <p className="!mt-6">
            At its heart, The Bean Book is about connection. It aims to connect
            coffee enthusiasts with the people and places that make Denver&apos;s
            coffee culture so unique. It&apos;s a tool for fostering community,
            supporting local businesses, and inspiring a deeper appreciation for
            the artistry of coffee.
          </p>

          <h2 className={sectionHeadingClass} style={headingStyle}>
            Are You Ready to Begin Your Coffee Journey?
          </h2>

          <div className="!mt-10 flex justify-center">
            <BuyButton />
          </div>
        </div>
      </section>
    </>
  );
}
