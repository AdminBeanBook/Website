export const ADMIN_MAIN_NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders", exact: false },
  { href: "/admin/email", label: "Email", exact: false },
  { href: "/admin/messages", label: "Messages", exact: false },
  { href: "/admin/calendar", label: "Calendar", exact: false },
  { href: "/admin/settings/links", label: "Quick links", exact: false },
  { href: "/admin/settings/contacts", label: "Contacts", exact: true },
  { href: "/admin/settings/customers", label: "Customers", exact: false },
] as const;

export function isAdminMainNavActive(
  pathname: string,
  item: (typeof ADMIN_MAIN_NAV)[number],
): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
