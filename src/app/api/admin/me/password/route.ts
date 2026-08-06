import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { changeOwnPassword } from "@/lib/admin/users";

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password are required" },
      { status: 400 },
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "New passwords do not match" },
      { status: 400 },
    );
  }

  try {
    await changeOwnPassword(admin.id, currentPassword, newPassword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not change password";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
