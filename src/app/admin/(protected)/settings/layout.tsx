import { SettingsLayoutClient } from "@/app/admin/(protected)/settings/SettingsLayoutClient";

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsLayoutClient>{children}</SettingsLayoutClient>;
}
