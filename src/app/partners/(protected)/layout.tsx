import { redirect } from "next/navigation";
import { PartnerShell } from "@/components/partners/PartnerShell";
import { requirePartnerSession } from "@/lib/partner-auth";

export default async function PartnersProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const partner = await requirePartnerSession();
  if (!partner) {
    redirect("/partners/login");
  }

  return <PartnerShell email={partner.email}>{children}</PartnerShell>;
}
