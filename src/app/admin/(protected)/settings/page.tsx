import { SETTINGS_ENTRY_PATH } from "@/components/admin/settings-nav";
import { redirect } from "next/navigation";

export default function AdminSettingsPage() {
  redirect(SETTINGS_ENTRY_PATH);
}
