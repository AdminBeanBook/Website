import { ContactsManager } from "@/components/admin/ContactsManager";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ContactsSettingsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/admin/login");

  const [contacts, tags] = await Promise.all([
    prisma.contact.findMany({
      include: { tags: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.contactTag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <ContactsManager
        initialContacts={contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          notes: c.notes,
          active: c.active,
          tags: c.tags,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        }))}
        initialTags={tags.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          color: t.color,
        }))}
    />
  );
}
