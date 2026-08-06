import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { syncCoffeeShopsToContacts } from "@/lib/contacts/from-coffee-shops";

/** Copy coffee shops into Contacts (tagged "Coffee shop"), including emails. */
export async function POST() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncCoffeeShopsToContacts({ activeOnly: true });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not sync coffee shops";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
