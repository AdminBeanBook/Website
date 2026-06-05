import { BulkEmailComposer } from "@/components/admin/BulkEmailComposer";
import { requireAdminSession } from "@/lib/auth";
import { ensureEmailSettings, getEmailSenders } from "@/lib/email/senders";
import { isEmailConfigured } from "@/lib/email/send";
import { getSiteConfig } from "@/lib/site-config";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ template?: string }>;
};

export default async function AdminEmailComposePage({ searchParams }: PageProps) {
  const admin = await requireAdminSession();
  if (!admin) redirect("/admin/login");

  const { template: templateId } = await searchParams;

  await ensureEmailSettings();
  const [senders, colors, contactTags, templates, prefill] = await Promise.all([
    getEmailSenders(),
    getSiteConfig("published"),
    prisma.contactTag.findMany({ orderBy: { name: "asc" } }),
    prisma.emailTemplate.findMany({ orderBy: { name: "asc" } }),
    templateId
      ? prisma.emailTemplate.findUnique({ where: { id: templateId } })
      : null,
  ]);

  return (
    <BulkEmailComposer
      initialSenders={senders}
      colors={colors.colors}
      emailConfigured={isEmailConfigured()}
      currentAdminEmail={admin.email}
      initialTags={contactTags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color,
      }))}
      initialTemplates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        htmlBody: t.htmlBody,
      }))}
      prefillTemplate={
        prefill
          ? {
              id: prefill.id,
              name: prefill.name,
              subject: prefill.subject,
              htmlBody: prefill.htmlBody,
            }
          : null
      }
    />
  );
}
