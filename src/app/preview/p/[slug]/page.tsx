import { notFound } from "next/navigation";
import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

type Props = { params: Promise<{ slug: string }> };

export default async function PreviewCustomPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageContent(slug, "draft");
  if (!page) notFound();
  return <PageViewByTemplate page={page} configVariant="draft" />;
}
