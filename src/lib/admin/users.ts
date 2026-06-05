import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function listAdminUsers() {
  return prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function createAdminUser(input: {
  email: string;
  password: string;
  name?: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("Email is required");
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) throw new Error("An admin with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      name: input.name?.trim() || null,
      active: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function updateAdminUser(
  id: string,
  input: { name?: string; active?: boolean; password?: string },
) {
  const data: {
    name?: string | null;
    active?: boolean;
    passwordHash?: string;
  } = {};

  if (input.name !== undefined) data.name = input.name.trim() || null;
  if (input.active !== undefined) data.active = input.active;
  if (input.password?.trim()) {
    if (input.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    data.passwordHash = await bcrypt.hash(input.password, 12);
  }

  return prisma.adminUser.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function deleteAdminUser(id: string, currentUserId: string) {
  if (id === currentUserId) {
    throw new Error("You cannot remove your own account");
  }

  const count = await prisma.adminUser.count({ where: { active: true } });
  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) throw new Error("Admin not found");
  if (count <= 1 && target.active) {
    throw new Error("Cannot remove the last active admin");
  }

  await prisma.adminUser.delete({ where: { id } });
}
