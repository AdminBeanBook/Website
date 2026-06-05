import type { Metadata } from "next";
import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Purchase",
};

export default async function PurchasePage() {
  const page = await getPageContent("purchase", "published");
  if (!page) return null;
  return <PageViewByTemplate page={page} />;
}
