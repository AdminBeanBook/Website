import { getEffectivePageTemplate } from "@/lib/pages/template";
import type { PageTemplate } from "@/lib/site-config/types";

type PagePathInput = {
  slug: string;
  path: string | null;
  template: string;
};

function withEffectiveTemplate(page: PagePathInput): PagePathInput & {
  template: PageTemplate;
} {
  return {
    ...page,
    template: getEffectivePageTemplate(page.slug, page.template),
  };
}

export function getPageLivePath(page: PagePathInput): string {
  const { slug, template } = withEffectiveTemplate(page);
  if (page.path) return page.path;
  if (template === "content") return `/p/${slug}`;
  return `/${slug === "home" ? "" : slug}`.replace("//", "/") || "/";
}

export function getPagePreviewPath(page: PagePathInput): string {
  const resolved = withEffectiveTemplate(page);
  const live = getPageLivePath(resolved);
  if (live === "/") return "/preview";
  if (resolved.template === "content") return `/preview/p/${resolved.slug}`;
  return `/preview${live}`;
}

export function defaultPathForTemplate(
  slug: string,
  template: PageTemplate,
): string {
  if (template === "home") return "/";
  if (template === "content") return `/p/${slug}`;
  return `/${slug}`;
}
