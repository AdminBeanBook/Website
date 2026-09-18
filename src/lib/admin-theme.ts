export const ADMIN_THEME_KEY = "bb-admin-theme";

export type AdminTheme = "light" | "dark";

export function readAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(ADMIN_THEME_KEY);
    return stored === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function writeAdminTheme(theme: AdminTheme) {
  try {
    window.localStorage.setItem(ADMIN_THEME_KEY, theme);
  } catch {
    // ignore quota / private mode
  }
}
