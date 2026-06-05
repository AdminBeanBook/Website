import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";
import type { ResolvedPageContent } from "@/lib/pages";
import type { PageTextColorsContext } from "@/lib/pages/text-colors";

type ContactPageViewProps = {
  page: ResolvedPageContent;
  textColors: PageTextColorsContext;
};

export function ContactPageView({ page, textColors }: ContactPageViewProps) {
  return (
    <>
      <PageHero title={page.title} textColors={textColors} />
      <section className="px-6 py-16">
        <ContactForm />
      </section>
    </>
  );
}
