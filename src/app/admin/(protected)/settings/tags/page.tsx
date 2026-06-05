import { redirect } from "next/navigation";

export default function TagsSettingsRedirect() {
  redirect("/admin/settings/contacts/tags");
}
