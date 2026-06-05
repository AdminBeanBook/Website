import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-session";

export async function authenticateAdmin(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user || !user.active) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return user;
}

export async function requireAdminSession() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.adminUser.findUnique({
    where: { id: session.userId },
  });
  if (!user?.active) return null;
  return { id: user.id, email: user.email };
}
