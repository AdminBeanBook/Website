import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { syncAllCustomersToContacts } from "@/lib/contacts/from-customer";

/** One-time / on-demand: copy all Customers into Contacts (tagged "Customer"). */
export async function POST() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllCustomersToContacts();
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not sync customers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
