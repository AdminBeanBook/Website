import { getDefaultPage } from "@/lib/page-defaults";
import type { PageTemplate } from "@/lib/site-config/types";

/** Built-in pages always keep their layout template (not generic CMS content). */
export function getEffectivePageTemplate(
  slug: string,
  template: string | null | undefined,
): PageTemplate {
  const defaults = getDefaultPage(slug);
  if (defaults?.isSystem) return defaults.template;
  if (defaults && defaults.template !== "content") return defaults.template;
  const value = template ?? defaults?.template ?? "content";
  return value as PageTemplate;
}
