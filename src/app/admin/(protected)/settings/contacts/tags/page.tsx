import { TagsManager } from "@/components/admin/TagsManager";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ContactsTagsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/admin/login");

  const tags = await prisma.contactTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { contacts: true } } },
  });

  return (
    <TagsManager
      initialTags={tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color,
        contactCount: t._count.contacts,
      }))}
    />
  );
}
