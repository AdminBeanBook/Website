import { EmailTemplatesManager } from "@/components/admin/EmailTemplatesManager";
import { requireAdminSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site-config";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminEmailTemplatesPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/admin/login");

  const [templates, colors] = await Promise.all([
    prisma.emailTemplate.findMany({ orderBy: { name: "asc" } }),
    getSiteConfig("published"),
  ]);

  return (
    <EmailTemplatesManager
      initialTemplates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        htmlBody: t.htmlBody,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }))}
      colors={colors.colors}
    />
  );
}
