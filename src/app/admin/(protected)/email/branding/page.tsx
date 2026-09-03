import { EmailBrandingEditor } from "@/components/admin/EmailBrandingEditor";
import { requireAdminSession } from "@/lib/auth";
import { DEFAULT_EMAIL_BRANDING, getSiteConfig } from "@/lib/site-config";
import { redirect } from "next/navigation";

export default async function AdminEmailBrandingPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/admin/login");

  const site = await getSiteConfig("published");
  const branding = site.emailBranding ?? DEFAULT_EMAIL_BRANDING;

  return (
    <EmailBrandingEditor initial={branding} siteName={site.site.name} />
  );
}
