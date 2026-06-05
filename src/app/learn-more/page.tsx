import type { Metadata } from "next";
import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Learn More",
};

export default async function LearnMorePage() {
  const page = await getPageContent("learn-more", "published");
  if (!page) return null;
  return <PageViewByTemplate page={page} />;
}
