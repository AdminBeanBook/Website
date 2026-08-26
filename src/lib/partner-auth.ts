import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getPartnerSession } from "@/lib/partner-session";

export async function authenticatePartner(email: string, password: string) {
  const user = await prisma.shopPartnerUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user || !user.active) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return user;
}

export async function requirePartnerSession() {
  const session = await getPartnerSession();
  if (!session) return null;
  const user = await prisma.shopPartnerUser.findUnique({
    where: { id: session.userId },
  });
  if (!user?.active) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function isPartnerSuperAdmin(role: string) {
  return role === "shop_super_admin";
}
