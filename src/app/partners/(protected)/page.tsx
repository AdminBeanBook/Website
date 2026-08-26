import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePartnerSession } from "@/lib/partner-auth";
import {
  groupAppShopsByBrand,
  listEditableAppShops,
} from "@/lib/app-shops";

export default async function PartnersHomePage() {
  const partner = await requirePartnerSession();
  if (!partner) redirect("/partners/login");

  const shops = await listEditableAppShops({
    partnerId: partner.id,
    role: partner.role,
  });
  const brands = groupAppShopsByBrand(shops);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Your shops</h1>
        <p className="mt-1 text-sm text-[#6B3F1F]/80">
          Edit blurbs, logos, and limited-time deals. Changes show in the member
          app.
        </p>
      </div>

      {brands.length === 0 ? (
        <p className="rounded-xl border border-[#2C1A0E]/10 bg-white p-6 text-sm text-[#6B3F1F]">
          No shops assigned yet. Ask Bean Book admin to link your account.
        </p>
      ) : (
        <ul className="space-y-3">
          {brands.map((brand) => (
            <li key={brand.key}>
              <Link
                href={`/partners/shops/${encodeURIComponent(brand.key)}`}
                className="flex items-center gap-4 rounded-xl border border-[#2C1A0E]/10 bg-white p-4 transition hover:border-[#D4A847]"
              >
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-[#F5EFE0]">
                  {brand.primary.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.primary.logoUrl}
                      alt=""
                      className="h-12 w-12 object-contain"
                    />
                  ) : (
                    <span className="text-2xl">{brand.primary.emoji}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{brand.displayName}</p>
                  <p className="text-sm text-[#6B3F1F]/75">
                    {brand.locations.length} location
                    {brand.locations.length === 1 ? "" : "s"} · tap to edit
                  </p>
                </div>
                <span className="text-xl text-[#6B3F1F]/50">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
