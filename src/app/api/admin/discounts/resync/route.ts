import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { resyncAllDiscountsToStripe } from "@/lib/stripe-discounts";

/** Re-create all discount codes on the current Stripe account. */
export async function POST() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await resyncAllDiscountsToStripe();
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not resync discounts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
