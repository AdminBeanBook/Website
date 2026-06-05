import { NextResponse } from "next/server";
import {
  authenticateAdmin,
} from "@/lib/auth";
import {
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth-session";

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

    const user = await authenticateAdmin(email.trim().toLowerCase(), password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSessionToken(user.id, user.email);
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, email: user.email });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
