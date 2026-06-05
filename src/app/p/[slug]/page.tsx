import { notFound } from "next/navigation";
import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

type Props = { params: Promise<{ slug: string }> };

export default async function CustomPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageContent(slug, "published");
  if (!page || !page.enabled || page.template !== "content") {
    notFound();
  }
  return <PageViewByTemplate page={page} />;
}
