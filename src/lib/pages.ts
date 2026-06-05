import { prisma } from "@/lib/db";
import { getDefaultPage, PAGE_DEFAULTS, slugifyPageSlug } from "@/lib/page-defaults";
import { defaultPathForTemplate, getPageLivePath, getPagePreviewPath } from "@/lib/pages/paths";
import {
  parsePageTextColors,
  serializePageTextColors,
  pageTextColorsEqual,
  type PageTextColorOverrides,
} from "@/lib/pages/text-colors";
import { getEffectivePageTemplate } from "@/lib/pages/template";
import {
  parsePlacedImages,
  parsePlacedImagesDraft,
  placedImagesEqual,
  serializePlacedImages,
  type PlacedPageImage,
} from "@/lib/pages/placed-images";
import type { PageTemplate } from "@/lib/site-config/types";

export type { PlacedPageImage } from "@/lib/pages/placed-images";
export {
  parsePlacedImages,
  parsePlacedImagesDraft,
  serializePlacedImages,
} from "@/lib/pages/placed-images";

export type { PageTextColorOverrides } from "@/lib/pages/text-colors";
export {
  parsePageTextColors,
  serializePageTextColors,
} from "@/lib/pages/text-colors";
export { getPageTextSlots } from "@/lib/pages/text-slots";

export type PageContentVariant = "published" | "draft";

export { getPageLivePath, getPagePreviewPath, defaultPathForTemplate };

export type ResolvedPageContent = {
  slug: string;
  path: string;
  template: string;
  enabled: boolean;
  showInNav: boolean;
  title: string;
  subtitle: string | null;
  body: string;
  placedImages: PlacedPageImage[];
  textColorOverrides: PageTextColorOverrides;
};

type PageRecord = {
  slug: string;
  path: string | null;
  template: string;
  enabled: boolean;
  showInNav: boolean;
  title: string;
  subtitle: string | null;
  body: string;
  placedImages: string;
  draftTitle: string | null;
  draftSubtitle: string | null;
  draftBody: string | null;
  draftPlacedImages: string | null;
  draftPath: string | null;
  draftTemplate: string | null;
  draftEnabled: boolean | null;
  draftShowInNav: boolean | null;
  textColors: string | null;
  draftTextColors: string | null;
};

function resolveFields(
  slug: string,
  record: PageRecord | null,
  defaults: ReturnType<typeof getDefaultPage>,
  variant: PageContentVariant,
) {
  const useDraft = variant === "draft";
  const path =
    (useDraft ? record?.draftPath : null) ??
    record?.path ??
    defaults?.path ??
    "/";
  const rawTemplate =
    (useDraft ? record?.draftTemplate : null) ??
    record?.template ??
    defaults?.template ??
    "content";
  const template = getEffectivePageTemplate(slug, rawTemplate);
  const enabled =
    (useDraft ? record?.draftEnabled : null) ??
    record?.enabled ??
    true;
  const showInNav =
    (useDraft ? record?.draftShowInNav : null) ??
    record?.showInNav ??
    false;

  if (variant === "published") {
    const publishedTemplate = getEffectivePageTemplate(
      slug,
      record?.template ?? defaults?.template ?? "content",
    );
    return {
      path: record?.path ?? defaults?.path ?? "/",
      template: publishedTemplate,
      enabled: record?.enabled ?? true,
      showInNav: record?.showInNav ?? false,
      title: record?.title ?? defaults?.title ?? "",
      subtitle: record?.subtitle ?? defaults?.subtitle ?? null,
      body: record?.body || defaults?.body || "",
      placedImages: parsePlacedImages(record?.placedImages),
      textColorOverrides: parsePageTextColors(record?.textColors),
    };
  }

  return {
    path,
    template,
    enabled,
    showInNav,
    title: record?.draftTitle ?? record?.title ?? defaults?.title ?? "",
    subtitle:
      record?.draftSubtitle !== undefined && record?.draftSubtitle !== null
        ? record.draftSubtitle
        : (record?.subtitle ?? defaults?.subtitle ?? null),
    body:
      record?.draftBody !== undefined && record?.draftBody !== null
        ? record.draftBody
        : (record?.body || defaults?.body || ""),
    placedImages: parsePlacedImagesDraft(
      record?.draftPlacedImages ?? record?.placedImages,
    ),
    textColorOverrides: parsePageTextColors(
      record?.draftTextColors ?? record?.textColors,
    ),
  };
}

export async function getPageContent(
  slug: string,
  variant: PageContentVariant = "published",
): Promise<ResolvedPageContent | null> {
  const defaults = getDefaultPage(slug);
  const record = await prisma.pageContent.findUnique({ where: { slug } });
  if (!record && !defaults) return null;

  const fields = resolveFields(slug, record, defaults, variant);
  return { slug, ...fields };
}

export function pageHasUnpublishedChanges(page: PageRecord & { id: string }): boolean {
  const draftTitle = page.draftTitle ?? page.title;
  const draftSubtitle = page.draftSubtitle ?? page.subtitle;
  const draftBody = page.draftBody ?? page.body;
  const draftPlaced = parsePlacedImagesDraft(page.draftPlacedImages ?? page.placedImages);
  const publishedPlaced = parsePlacedImages(page.placedImages);
  const draftPath = page.draftPath ?? page.path;
  const draftTemplate = page.draftTemplate ?? page.template;
  const draftEnabled = page.draftEnabled ?? page.enabled;
  const draftShowInNav = page.draftShowInNav ?? page.showInNav;
  const draftTextColors = parsePageTextColors(page.draftTextColors);
  const publishedTextColors = parsePageTextColors(page.textColors);
  const template = page.draftTemplate ?? page.template;

  return (
    draftTitle !== page.title ||
    draftSubtitle !== page.subtitle ||
    draftBody !== page.body ||
    !placedImagesEqual(draftPlaced, publishedPlaced) ||
    draftPath !== page.path ||
    draftTemplate !== page.template ||
    draftEnabled !== page.enabled ||
    draftShowInNav !== page.showInNav ||
    !pageTextColorsEqual(draftTextColors, publishedTextColors, template)
  );
}

export async function ensurePageDraftsInitialized() {
  const pages = await prisma.pageContent.findMany();
  await Promise.all(
    pages.map((page) => {
      const def = getDefaultPage(page.slug);
      const path =
        page.path ||
        def?.path ||
        defaultPathForTemplate(page.slug, (page.template as PageTemplate) || "content");
      const template = page.template || def?.template || "content";
      const needsUpdate =
        !page.path ||
        page.draftTitle === null ||
        page.draftBody === null ||
        page.draftPlacedImages === null ||
        page.draftPath === null;

      if (!needsUpdate) return Promise.resolve();

      return prisma.pageContent.update({
        where: { id: page.id },
        data: {
          path,
          template,
          draftTitle: page.draftTitle ?? page.title,
          draftSubtitle: page.draftSubtitle ?? page.subtitle,
          draftBody: page.draftBody ?? page.body,
          draftPlacedImages: page.draftPlacedImages ?? page.placedImages,
          draftPath: page.draftPath ?? path,
          draftTemplate: page.draftTemplate ?? template,
          draftEnabled: page.draftEnabled ?? page.enabled,
          draftShowInNav: page.draftShowInNav ?? page.showInNav,
          draftUpdatedAt: page.draftUpdatedAt ?? new Date(),
        },
      });
    }),
  );
}

/** Fix system pages that were saved with template "content" in the database. */
export async function repairSystemPageRecords() {
  const learnMoreDefault = PAGE_DEFAULTS.find((d) => d.slug === "learn-more");

  await Promise.all(
    PAGE_DEFAULTS.filter((def) => def.isSystem).map((def) =>
      prisma.pageContent.updateMany({
        where: { slug: def.slug },
        data: {
          template: def.template,
          draftTemplate: def.template,
          isSystem: true,
        },
      }),
    ),
  );

  if (learnMoreDefault?.body) {
    await prisma.pageContent.updateMany({
      where: { slug: "learn-more", body: "" },
      data: {
        body: learnMoreDefault.body,
        draftBody: learnMoreDefault.body,
      },
    });
  }
}

export async function ensurePagesSeeded() {
  for (const def of PAGE_DEFAULTS) {
    await prisma.pageContent.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        path: def.path,
        template: def.template,
        enabled: true,
        showInNav: def.showInNav,
        sortOrder: def.sortOrder,
        isSystem: def.isSystem,
        title: def.title,
        subtitle: def.subtitle ?? null,
        body: def.body,
        placedImages: "[]",
        draftTitle: def.title,
        draftSubtitle: def.subtitle ?? null,
        draftBody: def.body,
        draftPlacedImages: "[]",
        draftPath: def.path,
        draftTemplate: def.template,
        draftEnabled: true,
        draftShowInNav: def.showInNav,
        draftUpdatedAt: new Date(),
      },
      update: {},
    });
  }
  await repairSystemPageRecords();
}

export async function getAllPagesForAdmin() {
  await ensurePagesSeeded();
  await ensurePageDraftsInitialized();
  return prisma.pageContent.findMany({ orderBy: [{ sortOrder: "asc" }, { slug: "asc" }] });
}

export async function savePageDraft(input: {
  slug: string;
  title: string;
  subtitle: string | null;
  body: string;
  placedImages?: PlacedPageImage[];
  textColors?: PageTextColorOverrides;
  path?: string;
  template?: string;
  enabled?: boolean;
  showInNav?: boolean;
}) {
  const data: Record<string, unknown> = {
    draftTitle: input.title,
    draftSubtitle: input.subtitle,
    draftBody: input.body,
    draftTextColors: serializePageTextColors(input.textColors ?? {}),
    draftUpdatedAt: new Date(),
  };
  if (input.placedImages !== undefined) {
    data.draftPlacedImages = serializePlacedImages(input.placedImages);
  }
  if (input.path !== undefined) data.draftPath = input.path;
  if (input.template !== undefined) data.draftTemplate = input.template;
  if (input.enabled !== undefined) data.draftEnabled = input.enabled;
  if (input.showInNav !== undefined) data.draftShowInNav = input.showInNav;

  return prisma.pageContent.update({
    where: { slug: input.slug },
    data,
  });
}

export async function createPage(input: {
  title: string;
  slug?: string;
  template?: PageTemplate;
  showInNav?: boolean;
}) {
  const slug = input.slug?.trim() || slugifyPageSlug(input.title);
  const template = input.template ?? "content";
  const path = defaultPathForTemplate(slug, template);

  const existing = await prisma.pageContent.findFirst({
    where: { OR: [{ slug }, { path }] },
  });
  if (existing) throw new Error("A page with this slug or path already exists");

  const maxOrder = await prisma.pageContent.aggregate({ _max: { sortOrder: true } });

  return prisma.pageContent.create({
    data: {
      slug,
      path,
      template,
      enabled: true,
      showInNav: input.showInNav ?? false,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      isSystem: false,
      title: input.title,
      subtitle: null,
      body: "",
      placedImages: "[]",
      draftTitle: input.title,
      draftSubtitle: null,
      draftBody: "",
      draftPlacedImages: "[]",
      draftPath: path,
      draftTemplate: template,
      draftEnabled: true,
      draftShowInNav: input.showInNav ?? false,
      draftUpdatedAt: new Date(),
    },
  });
}

export async function deletePage(slug: string) {
  const page = await prisma.pageContent.findUnique({ where: { slug } });
  if (!page) throw new Error("Page not found");
  if (page.isSystem) throw new Error("System pages cannot be deleted");
  await prisma.pageContent.delete({ where: { slug } });
}

export async function publishPage(slug: string) {
  const page = await prisma.pageContent.findUnique({ where: { slug } });
  if (!page) throw new Error("Page not found");

  const title = page.draftTitle ?? page.title;
  const subtitle = page.draftSubtitle ?? page.subtitle;
  const body = page.draftBody ?? page.body;
  const placedImages = page.draftPlacedImages ?? page.placedImages;
  const path = page.draftPath ?? page.path;
  const template = page.draftTemplate ?? page.template;
  const enabled = page.draftEnabled ?? page.enabled;
  const showInNav = page.draftShowInNav ?? page.showInNav;
  const textColors =
    page.draftTextColors ?? serializePageTextColors({});
  const now = new Date();

  return prisma.pageContent.update({
    where: { slug },
    data: {
      title,
      subtitle,
      body,
      placedImages,
      path,
      template,
      enabled,
      showInNav,
      textColors,
      publishedAt: now,
      draftTitle: title,
      draftSubtitle: subtitle,
      draftBody: body,
      draftPlacedImages: placedImages,
      draftTextColors: textColors,
      draftPath: path,
      draftTemplate: template,
      draftEnabled: enabled,
      draftShowInNav: showInNav,
      draftUpdatedAt: now,
    },
  });
}

export async function publishAllPages() {
  const pages = await prisma.pageContent.findMany();
  const changed = pages.filter(pageHasUnpublishedChanges);
  await Promise.all(changed.map((p) => publishPage(p.slug)));
  return changed.length;
}

export async function discardPageDraft(slug: string) {
  const page = await prisma.pageContent.findUnique({ where: { slug } });
  if (!page) throw new Error("Page not found");

  return prisma.pageContent.update({
    where: { slug },
    data: {
      draftTitle: page.title,
      draftSubtitle: page.subtitle,
      draftBody: page.body,
      draftPlacedImages: page.placedImages,
      draftTextColors: page.textColors,
      draftPath: page.path,
      draftTemplate: page.template,
      draftEnabled: page.enabled,
      draftShowInNav: page.showInNav,
      draftUpdatedAt: new Date(),
    },
  });
}

export function resolvePageForPreview(
  page: PageRecord,
  variant: PageContentVariant,
): ResolvedPageContent {
  const defaults = getDefaultPage(page.slug);
  const fields = resolveFields(page.slug, page, defaults, variant);
  return { slug: page.slug, ...fields };
}
