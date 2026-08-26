import { notFound, redirect } from "next/navigation";
import { PartnerShopEditor } from "@/components/partners/PartnerShopEditor";
import { requirePartnerSession } from "@/lib/partner-auth";
import {
  getShopBrandKey,
  groupAppShopsByBrand,
  listEditableAppShops,
} from "@/lib/app-shops";

export default async function PartnerShopEditPage({
  params,
}: {
  params: Promise<{ brandKey: string }>;
}) {
  const partner = await requirePartnerSession();
  if (!partner) redirect("/partners/login");

  const { brandKey: rawKey } = await params;
  const brandKey = decodeURIComponent(rawKey).toLowerCase();

  const shops = await listEditableAppShops({
    partnerId: partner.id,
    role: partner.role,
  });
  const brand = groupAppShopsByBrand(shops).find(
    (item) => item.key === brandKey || getShopBrandKey(item.displayName) === brandKey,
  );

  if (!brand) notFound();

  return (
    <PartnerShopEditor
      brandKey={brand.key}
      displayName={brand.displayName}
      shopIds={brand.locations.map((shop) => shop.id)}
      locationCount={brand.locations.length}
      initialDescription={brand.primary.description ?? ""}
      initialLogoUrl={brand.primary.logoUrl}
    />
  );
}
