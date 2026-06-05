import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import type { ResolvedPageContent } from "@/lib/pages";
import { parseLearnMoreTeam } from "@/lib/pages/learn-more-team";
import {
  colorStyle,
  type PageTextColorsContext,
} from "@/lib/pages/text-colors";

type LearnMorePageViewProps = {
  page: ResolvedPageContent;
  textColors: PageTextColorsContext;
};

export function LearnMorePageView({ page, textColors }: LearnMorePageViewProps) {
  const { members } = parseLearnMoreTeam(page.body);

  return (
    <>
      <PageHero
        title={page.title}
        subtitle={page.subtitle ?? undefined}
        textColors={textColors}
      />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl space-y-20">
          {members.map((member, index) => (
            <article key={`${member.name}-${index}`} className="text-center">
              {member.image && (
                <div className="relative mx-auto mb-6 h-40 w-40 overflow-hidden rounded-full bg-brand-cream">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                </div>
              )}
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
                {member.coffee && <p className="italic">{member.coffee}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
