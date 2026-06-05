import type { Metadata } from "next";
import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

export const metadata: Metadata = {
  title: "The Whole Idea",
};

export default async function SoWhatIsItPage() {
  const page = await getPageContent("so-what-is-it", "published");
  if (!page) return null;
  return <PageViewByTemplate page={page} />;
}
