import { NextResponse } from "next/server";
import { clearPartnerSessionCookie } from "@/lib/partner-session";

export async function POST() {
  await clearPartnerSessionCookie();
  return NextResponse.json({ ok: true });
}
