import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createAdminUser, listAdminUsers } from "@/lib/admin/users";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await listAdminUsers();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
  };

  try {
    const user = await createAdminUser({
      email: body.email ?? "",
      password: body.password ?? "",
      name: body.name,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create admin";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
