import { NextResponse } from "next/server";
import { authenticatePartner } from "@/lib/partner-auth";
import {
  createPartnerSessionToken,
  setPartnerSessionCookie,
} from "@/lib/partner-session";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 },
      );
    }

    const user = await authenticatePartner(email.trim().toLowerCase(), password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createPartnerSessionToken(user.id, user.email);
    await setPartnerSessionCookie(token);

    return NextResponse.json({ ok: true, email: user.email });
  } catch (err) {
    console.error("Partner login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
