import type { Metadata } from "next";
import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default async function ContactPage() {
  const page = await getPageContent("contact", "published");
  if (!page) return null;
  return <PageViewByTemplate page={page} />;
}
