export type SettingsNavItem = {
  href: string;
  label: string;
  /** Match pathname exactly (e.g. settings home) */
  exact?: boolean;
};

export const SETTINGS_NAV: SettingsNavItem[] = [
  { href: "/admin/settings/admins", label: "Admin access" },
  { href: "/admin/settings/contacts", label: "Contacts", exact: true },
  { href: "/admin/settings/contacts/tags", label: "Tags" },
  { href: "/admin/settings/shops", label: "Coffee shops" },
  { href: "/admin/settings/products", label: "Products" },
  { href: "/admin/settings/packages", label: "Packages" },
  { href: "/admin/settings/customers", label: "Customers" },
  { href: "/admin/settings/discounts", label: "Discount codes" },
  { href: "/admin/settings/pages", label: "Website editor" },
];

/** Where the top-nav “Settings” link lands (first sidebar item). */
export const SETTINGS_ENTRY_PATH = SETTINGS_NAV[0].href;

export function isSettingsAreaPath(pathname: string): boolean {
  if (pathname === "/admin/settings" || pathname.startsWith("/admin/settings/")) {
    return true;
  }
  return SETTINGS_NAV.some(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

export function isSettingsNavActive(pathname: string, item: SettingsNavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  if (item.href === "/admin/settings/contacts") {
    return (
      pathname === "/admin/settings/contacts" ||
      (pathname.startsWith("/admin/settings/contacts/") &&
        !pathname.startsWith("/admin/settings/contacts/tags"))
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
