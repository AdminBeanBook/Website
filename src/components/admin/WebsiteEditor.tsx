"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CoffeeShopsManager } from "@/components/admin/CoffeeShopsManager";
import { ImageField } from "@/components/admin/website-editor/ImageField";
import {
  normalizeCanvasPosition,
  type ButtonDragPayload,
} from "@/components/admin/website-editor/button-placement";
import { DraggableButtonHandle } from "@/components/admin/website-editor/DraggableButtonHandle";
import { EditorPreviewFrame } from "@/components/admin/website-editor/EditorPreviewFrame";
import {
  buttonAppliesToPage,
  getNavEntriesForPage,
  defaultCustomizeTab,
  getCustomizeTabs,
  getPageEditorLabel,
  getPageImageFields,
  type EditorCustomizeTab,
} from "@/components/admin/website-editor/page-context";
import type { CoffeeShopRow } from "@/lib/coffee-shops";
import type { SiteConfig } from "@/lib/site-config";
import {
  applyConfigButtonPosition,
  applyConfigNewButtonAt,
  getButtonPagePosition,
  migrateSiteConfigButtons,
} from "@/lib/site-config";
import { getPageLivePath, getPagePreviewPath } from "@/lib/pages";
import { PageTextFields } from "@/components/admin/website-editor/PageTextFields";
import { BRAND_COLOR_FIELDS } from "@/lib/site-config/color-fields";
import { SITE_TEXT_COLOR_FIELDS } from "@/lib/site-config/text-colors";
import {
  parsePageTextColors,
  type PageTextColorOverrides,
} from "@/lib/pages/text-colors";
import { LearnMoreTeamEditor } from "@/components/admin/website-editor/LearnMoreTeamEditor";
import { PlacedImagesEditor } from "@/components/admin/website-editor/PlacedImagesEditor";
import type { ImageDragPayload } from "@/components/admin/website-editor/image-placement";
import {
  DEFAULT_PLACED_IMAGE_WIDTH,
  parsePlacedImagesDraft,
  type PlacedPageImage,
} from "@/lib/pages/placed-images";
import {
  parseLearnMoreTeam,
  serializeLearnMoreTeam,
  type LearnMoreTeamMember,
} from "@/lib/pages/learn-more-team";

type AdminPage = {
  id: string;
  slug: string;
  path: string | null;
  template: string;
  enabled: boolean;
  showInNav: boolean;
  isSystem: boolean;
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
  draftTextColors: string | null;
  textColors: string | null;
  hasUnpublishedChanges?: boolean;
};

function draftPageFields(page: AdminPage) {
  return {
    title: page.draftTitle ?? page.title,
    subtitle: page.draftSubtitle ?? page.subtitle ?? "",
    body: page.draftBody ?? page.body,
    path: page.draftPath ?? page.path,
    template: page.draftTemplate ?? page.template,
    enabled: page.draftEnabled ?? page.enabled,
    showInNav: page.draftShowInNav ?? page.showInNav,
  };
}

const HOME_BODY_HINT = `Home body JSON:
{"description":"...","paragraph":"..."}`;

type WebsiteEditorProps = {
  pages: AdminPage[];
  initialSiteConfig: SiteConfig;
  siteHasChanges: boolean;
  initialCoffeeShops: CoffeeShopRow[];
};

export function WebsiteEditor({
  pages: initialPages,
  initialSiteConfig,
  siteHasChanges: initialSiteChanges,
  initialCoffeeShops,
}: WebsiteEditorProps) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [siteConfig, setSiteConfig] = useState(() =>
    migrateSiteConfigButtons(initialSiteConfig),
  );
  const [siteDirty, setSiteDirty] = useState(initialSiteChanges);
  const [tab, setTab] = useState<EditorCustomizeTab>(() =>
    defaultCustomizeTab(initialPages[0]?.slug ?? "home"),
  );
  const [selected, setSelected] = useState(initialPages[0]?.slug ?? "home");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [teamMembers, setTeamMembers] = useState<LearnMoreTeamMember[]>([]);
  const [placedImages, setPlacedImages] = useState<PlacedPageImage[]>([]);
  const [pageEnabled, setPageEnabled] = useState(true);
  const [showInNav, setShowInNav] = useState(false);
  const [textColors, setTextColors] = useState<PageTextColorOverrides>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const page = pages.find((p) => p.slug === selected) ?? pages[0];
  const draft = page ? draftPageFields(page) : null;
  const pageTemplate = draft?.template ?? page?.template ?? "content";
  const pageContext = page
    ? { slug: page.slug, path: draft?.path ?? page.path, template: pageTemplate }
    : null;

  const previewPath = page
    ? getPagePreviewPath({
        slug: page.slug,
        path: draft?.path ?? page.path,
        template: pageTemplate,
      })
    : "/preview";

  const livePath = page
    ? getPageLivePath({
        slug: page.slug,
        path: page.path,
        template: page.template,
      })
    : "/";

  const pageDirtyCount = pages.filter((p) => p.hasUnpublishedChanges).length;
  const totalDirty = pageDirtyCount + (siteDirty ? 1 : 0);

  const pageSlug = page?.slug ?? "home";
  const customizeTabs = useMemo(() => getCustomizeTabs(pageSlug), [pageSlug]);
  const isMapPage = pageSlug === "map";

  const pageButtons = useMemo(
    () =>
      siteConfig.buttons
        .map((btn, index) => ({ btn, index }))
        .filter(
          ({ btn }) =>
            Boolean(getButtonPagePosition(btn, pageSlug)) ||
            btn.placement.some(
              (p) =>
                p !== "header" &&
                buttonAppliesToPage(btn, pageSlug, pageTemplate),
            ),
        ),
    [siteConfig.buttons, pageSlug, pageTemplate],
  );

  const canvasButtons = useMemo(
    () =>
      pageButtons
        .map(({ btn }) => {
          const pos = getButtonPagePosition(btn, pageSlug);
          if (!pos) return null;
          return {
            id: btn.id,
            label: btn.label,
            x: pos.x,
            y: pos.y,
            style: btn.style,
          };
        })
        .filter((b): b is NonNullable<typeof b> => b !== null),
    [pageButtons, pageSlug],
  );

  const pageNavEntries = useMemo(
    () => (pageContext ? getNavEntriesForPage(siteConfig.nav, pageContext) : []),
    [siteConfig.nav, pageContext],
  );

  const pageImageFields = useMemo(
    () => getPageImageFields(pageTemplate),
    [pageTemplate],
  );

  const syncForm = useCallback((p: AdminPage) => {
    const d = draftPageFields(p);
    setTitle(d.title);
    setSubtitle(d.subtitle);
    setBody(d.body);
    if (p.slug === "learn-more") {
      setTeamMembers(parseLearnMoreTeam(d.body).members);
    }
    setPlacedImages(
      parsePlacedImagesDraft(p.draftPlacedImages ?? p.placedImages),
    );
    setPageEnabled(d.enabled);
    setShowInNav(d.showInNav);
    setTextColors(
      parsePageTextColors(p.draftTextColors ?? p.textColors),
    );
    setMessage(null);
  }, []);

  function handleTeamMembersChange(members: LearnMoreTeamMember[]) {
    setTeamMembers(members);
    setBody(serializeLearnMoreTeam(members));
  }

  async function persistPageDraft(
    overrides?: Partial<{
      placedImages: PlacedPageImage[];
      body: string;
    }>,
  ) {
    if (!page) return;
    const res = await fetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: page.slug,
        title,
        subtitle: subtitle || null,
        body: overrides?.body ?? body,
        placedImages: overrides?.placedImages ?? placedImages,
        enabled: pageEnabled,
        showInNav,
        textColors,
      }),
    });
    if (!res.ok) throw new Error("Failed to save page draft");
    const listRes = await fetch("/api/admin/pages");
    if (listRes.ok) {
      const list = (await listRes.json()) as AdminPage[];
      setPages(list);
    }
  }

  const handleImageCanvasPosition = useCallback(
    async (
      position: { x: number; y: number },
      payload: ImageDragPayload,
    ) => {
      let next: PlacedPageImage[];
      if (payload.kind === "new") {
        next = [
          ...placedImages,
          {
            id: `img-${Date.now()}`,
            url: "",
            x: position.x,
            y: position.y,
            width: DEFAULT_PLACED_IMAGE_WIDTH,
          },
        ];
      } else {
        next = placedImages.map((img) =>
          img.id === payload.imageId
            ? { ...img, x: position.x, y: position.y }
            : img,
        );
      }
      setPlacedImages(next);
      try {
        await persistPageDraft({ placedImages: next });
        setMessage(
          `Image at ${position.x}% × ${position.y}% — drag on preview to adjust`,
        );
        refreshPreview();
      } catch {
        setMessage("Position updated — save draft if preview looks stale");
        refreshPreview();
      }
    },
    [placedImages, page, title, subtitle, body, pageEnabled, showInNav, textColors],
  );

  useEffect(() => {
    if (page) syncForm(page);
  }, [page, syncForm]);

  useEffect(() => {
    if (pageSlug === "map") {
      setTab((t) =>
        customizeTabs.some((entry) => entry.id === t) ? t : "shops",
      );
      setRightPanelOpen(true);
    } else {
      setTab((t) => (t === "shops" ? "text" : t));
    }
  }, [pageSlug, customizeTabs]);

  useEffect(() => {
    if (tab === "photos") setRightPanelOpen(true);
  }, [tab]);

  function refreshPreview() {
    setPreviewKey((k) => k + 1);
  }

  function markSiteDirty() {
    setSiteDirty(true);
  }

  const handleCanvasPosition = useCallback(
    async (
      position: { x: number; y: number },
      payload: ButtonDragPayload,
    ) => {
      const pos = normalizeCanvasPosition(position.x, position.y);
      let nextConfig: SiteConfig | null = null;
      setSiteConfig((c) => {
        nextConfig =
          payload.kind === "new"
            ? applyConfigNewButtonAt(c, pageSlug, pos, pageTemplate)
            : applyConfigButtonPosition(c, payload.buttonId, pageSlug, pos);
        return nextConfig;
      });

      if (!nextConfig) return;
      markSiteDirty();
      try {
        await saveSiteDraft(nextConfig);
        setMessage(
          `Button at ${pos.x}% × ${pos.y}% — drag on preview to adjust`,
        );
        refreshPreview();
      } catch {
        setMessage("Updated — save draft if preview looks stale");
        refreshPreview();
      }
    },
    [pageSlug, pageTemplate],
  );

  async function saveSiteDraft(config: SiteConfig) {
    const res = await fetch("/api/admin/site-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error("Failed to save site settings");
    const data = (await res.json()) as {
      draft: SiteConfig;
      hasUnpublishedChanges: boolean;
    };
    setSiteConfig(data.draft);
    setSiteDirty(data.hasUnpublishedChanges);
  }

  async function handleSaveDraft() {
    setSaving(true);
    setMessage(null);
    try {
      if (page) {
        await fetch("/api/admin/pages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: page.slug,
            title,
            subtitle: subtitle || null,
            body,
            placedImages,
            enabled: pageEnabled,
            showInNav,
            textColors,
          }),
        });
        const listRes = await fetch("/api/admin/pages");
        if (listRes.ok) {
          const list = (await listRes.json()) as AdminPage[];
          setPages(list);
        }
      }
      await saveSiteDraft(siteConfig);
      setMessage("Draft saved");
      refreshPreview();
      router.refresh();
    } catch {
      setMessage("Failed to save draft");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setMessage(null);
    try {
      await fetch("/api/admin/pages/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page ? { slug: page.slug } : {}),
      });
      if (!page) {
        await fetch("/api/admin/pages/publish", { method: "POST", body: "{}" });
      }
      const [pagesRes, siteRes] = await Promise.all([
        fetch("/api/admin/pages"),
        fetch("/api/admin/site-config"),
      ]);
      if (pagesRes.ok) setPages(await pagesRes.json());
      if (siteRes.ok) {
        const s = (await siteRes.json()) as {
          draft: SiteConfig;
          hasUnpublishedChanges: boolean;
        };
        setSiteConfig(s.draft);
        setSiteDirty(s.hasUnpublishedChanges);
      }
      setMessage("Published to live site");
      refreshPreview();
      router.refresh();
    } catch {
      setMessage("Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  async function handlePublishAll() {
    setPublishing(true);
    await fetch("/api/admin/pages/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    setPublishing(false);
    setMessage("All changes published");
    router.refresh();
  }

  async function handleDiscard() {
    setDiscarding(true);
    try {
      if (page) {
        await fetch("/api/admin/pages/discard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: page.slug }),
        });
      }
      const siteRes = await fetch("/api/admin/site-config");
      if (siteRes.ok) {
        const s = (await siteRes.json()) as { published: SiteConfig };
        setSiteConfig(s.published);
        await saveSiteDraft(s.published);
        setSiteDirty(false);
      }
      const listRes = await fetch("/api/admin/pages");
      if (listRes.ok) {
        const list = (await listRes.json()) as AdminPage[];
        setPages(list);
        const current = list.find((p) => p.slug === selected);
        if (current) syncForm(current);
      }
      setMessage("Reverted to live version");
      refreshPreview();
    } finally {
      setDiscarding(false);
    }
  }

  async function handleCreatePage() {
    if (!newPageTitle.trim()) return;
    const res = await fetch("/api/admin/pages/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newPageTitle,
        template: "content",
        showInNav: true,
      }),
    });
    if (!res.ok) return;
    const created = (await res.json()) as AdminPage;
    const listRes = await fetch("/api/admin/pages");
    if (listRes.ok) setPages(await listRes.json());
    setSelected(created.slug);
    setNewPageTitle("");
    setMessage("Page created (draft)");
  }

  async function handleDeletePage() {
    if (!page || page.isSystem) return;
    if (!confirm(`Delete page "${page.slug}"?`)) return;
    await fetch(`/api/admin/pages/${page.slug}`, { method: "DELETE" });
    const listRes = await fetch("/api/admin/pages");
    if (listRes.ok) {
      const list = (await listRes.json()) as AdminPage[];
      setPages(list);
      setSelected(list[0]?.slug ?? "home");
    }
  }

  const tabClass = (t: EditorCustomizeTab) =>
    `block w-full rounded-lg px-3 py-2 text-left text-sm ${
      tab === t
        ? "bg-white font-medium text-brand-green shadow-sm"
        : "text-gray-700 hover:bg-white/80"
    }`;

  const panelTitle = useMemo(() => {
    const pageName = pageContext ? getPageEditorLabel(pageContext) : "";
    switch (tab) {
      case "shops":
        return "Coffee shops";
      case "text":
        return isMapPage ? `Hero text · ${pageName}` : `Text · ${pageName}`;
      case "colors":
        return `Colors · ${pageName}`;
      case "photos":
        return `Photos · ${pageName}`;
      case "buttons":
        return `Buttons · ${pageName}`;
      case "navigation":
        return `Navigation · ${pageName}`;
    }
  }, [tab, pageContext, isMapPage]);

  const rightPanel = useMemo(() => {
    if (!page) return null;

    if (tab === "shops" && isMapPage) {
      return (
        <CoffeeShopsManager
          initialShops={initialCoffeeShops}
          variant="sidebar"
          onAfterChange={refreshPreview}
        />
      );
    }

    if (tab === "colors") {
      return (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Main and accents control backgrounds and UI chrome. Header is the top
            nav bar only. Text defaults apply when a page element has no custom
            color (set per element on the Text tab).
          </p>
          {BRAND_COLOR_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {label}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={siteConfig.colors[key]}
                  onChange={(e) => {
                    markSiteDirty();
                    setSiteConfig((c) => ({
                      ...c,
                      colors: { ...c.colors, [key]: e.target.value },
                    }));
                  }}
                  className="h-9 w-12 cursor-pointer rounded border border-gray-300"
                />
                <input
                  value={siteConfig.colors[key]}
                  onChange={(e) => {
                    markSiteDirty();
                    setSiteConfig((c) => ({
                      ...c,
                      colors: { ...c.colors, [key]: e.target.value },
                    }));
                  }}
                  className="flex-1 rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
                />
              </div>
            </div>
          ))}
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Text defaults
          </p>
          {SITE_TEXT_COLOR_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {label}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={siteConfig.colors.text[key]}
                  onChange={(e) => {
                    markSiteDirty();
                    setSiteConfig((c) => ({
                      ...c,
                      colors: {
                        ...c.colors,
                        text: { ...c.colors.text, [key]: e.target.value },
                      },
                    }));
                  }}
                  className="h-9 w-12 cursor-pointer rounded border border-gray-300"
                />
                <input
                  value={siteConfig.colors.text[key]}
                  onChange={(e) => {
                    markSiteDirty();
                    setSiteConfig((c) => ({
                      ...c,
                      colors: {
                        ...c.colors,
                        text: { ...c.colors.text, [key]: e.target.value },
                      },
                    }));
                  }}
                  className="flex-1 rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (tab === "photos") {
      const fields = pageImageFields.filter((f) => !f.isGallery);
      const galleryField = pageImageFields.find((f) => f.isGallery);
      const isLearnMore = pageSlug === "learn-more";

      return (
        <div className="space-y-4">
          <PlacedImagesEditor
            images={placedImages}
            onChange={setPlacedImages}
            learnMoreTeamSection={
              isLearnMore ? (
                <div className="border-t border-gray-200 pt-4">
                  <p className="mb-2 text-xs font-semibold text-gray-700">
                    Learn More team
                  </p>
                  <LearnMoreTeamEditor
                    members={teamMembers}
                    onChange={handleTeamMembersChange}
                  />
                </div>
              ) : undefined
            }
          />
          <p className="text-xs font-semibold text-gray-700">Site-wide images</p>
          {fields.map(({ key, label }) => (
            <ImageField
              key={key}
              label={label}
              value={siteConfig.images[key] as string}
              onChange={(url) => {
                markSiteDirty();
                setSiteConfig((c) => ({
                  ...c,
                  images: { ...c.images, [key]: url },
                }));
              }}
            />
          ))}
          {galleryField && (
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">
                {galleryField.label}
              </p>
              {siteConfig.images.gallery.map((url, i) => (
                <div key={i} className="mb-3">
                  <ImageField
                    label={`Image ${i + 1}`}
                    value={url}
                    onChange={(v) => {
                      markSiteDirty();
                      setSiteConfig((c) => {
                        const gallery = [...c.images.gallery];
                        gallery[i] = v;
                        return { ...c, images: { ...c.images, gallery } };
                      });
                    }}
                  />
                  <button
                    type="button"
                    className="mt-1 text-xs text-red-600"
                    onClick={() => {
                      markSiteDirty();
                      setSiteConfig((c) => ({
                        ...c,
                        images: {
                          ...c.images,
                          gallery: c.images.gallery.filter((_, j) => j !== i),
                        },
                      }));
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-brand-green hover:underline"
                onClick={() => {
                  markSiteDirty();
                  setSiteConfig((c) => ({
                    ...c,
                    images: {
                      ...c.images,
                      gallery: [...c.images.gallery, ""],
                    },
                  }));
                }}
              >
                + Add gallery image
              </button>
            </div>
          )}
        </div>
      );
    }

    if (tab === "navigation") {
      return (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Menu links that point to this page ({livePath}). The header menu is
            shared site-wide.
          </p>
          {pageNavEntries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-xs text-gray-600">
              No menu link targets this page yet. Turn on{" "}
              <span className="font-medium">Show in navigation</span> under Text
              and publish, or add a link in the full menu under another page’s
              Navigation tab with href{" "}
              <code className="rounded bg-white px-1">{livePath}</code>.
            </p>
          ) : (
            pageNavEntries.map(({ link, index: i }) => (
              <div
                key={link.id}
                className="rounded border border-gray-200 p-2 text-sm"
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={link.enabled}
                    disabled={link.system}
                    onChange={(e) => {
                      markSiteDirty();
                      setSiteConfig((c) => {
                        const nav = [...c.nav];
                        nav[i] = { ...nav[i], enabled: e.target.checked };
                        return { ...c, nav };
                      });
                    }}
                  />
                  <span className="font-medium">{link.label}</span>
                </label>
                <input
                  value={link.label}
                  onChange={(e) => {
                    markSiteDirty();
                    setSiteConfig((c) => {
                      const nav = [...c.nav];
                      nav[i] = { ...nav[i], label: e.target.value };
                      return { ...c, nav };
                    });
                  }}
                  className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-xs"
                  disabled={link.system && link.id === "nav-map"}
                />
                <input
                  value={link.href}
                  onChange={(e) => {
                    markSiteDirty();
                    setSiteConfig((c) => {
                      const nav = [...c.nav];
                      nav[i] = { ...nav[i], href: e.target.value };
                      return { ...c, nav };
                    });
                  }}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1 font-mono text-xs"
                />
              </div>
            ))
          )}
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer font-medium text-gray-600">
              Edit full site menu
            </summary>
            <div className="mt-2 space-y-2">
              {siteConfig.nav.map((link, i) => (
                <div
                  key={link.id}
                  className="rounded border border-gray-100 bg-gray-50 p-2"
                >
                  <span className="font-medium">{link.label}</span>
                  <span className="ml-2 font-mono text-gray-400">{link.href}</span>
                  <label className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={link.enabled}
                      disabled={link.system}
                      onChange={(e) => {
                        markSiteDirty();
                        setSiteConfig((c) => {
                          const nav = [...c.nav];
                          nav[i] = { ...nav[i], enabled: e.target.checked };
                          return { ...c, nav };
                        });
                      }}
                    />
                    Visible
                  </label>
                </div>
              ))}
              <button
                type="button"
                className="text-brand-green hover:underline"
                onClick={() => {
                  markSiteDirty();
                  setSiteConfig((c) => ({
                    ...c,
                    nav: [
                      ...c.nav,
                      {
                        id: `nav-${Date.now()}`,
                        label: "New link",
                        href: livePath,
                        enabled: true,
                      },
                    ],
                  }));
                }}
              >
                + Add nav link
              </button>
            </div>
          </details>
        </div>
      );
    }

    if (tab === "buttons") {
      return (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Drag <strong>New button</strong> anywhere on the page preview, or
            drag the ⠿ handle / the button itself on the preview to reposition.
            Header buttons stay in the site header.
          </p>
          <DraggableButtonHandle
            payload={{ kind: "new" }}
            className="flex items-center gap-2 rounded-lg border border-dashed border-brand-green/50 bg-brand-green/5 px-3 py-2.5 text-sm font-medium text-brand-green"
          >
            <span aria-hidden>⠿</span>
            New button
          </DraggableButtonHandle>
          {pageButtons.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-xs text-gray-600">
              No buttons on this page yet. Drag “New button” onto the preview.
            </p>
          ) : (
            pageButtons.map(({ btn, index: i }) => (
              <DraggableButtonHandle
                key={btn.id}
                payload={{ kind: "move", buttonId: btn.id }}
                gripOnly
                className="rounded border border-gray-200 bg-white text-sm shadow-sm"
              >
              <div className="space-y-2 p-2">
                <p className="text-xs text-gray-400">
                  {(() => {
                    const pos = getButtonPagePosition(btn, pageSlug);
                    if (pos) return `Position: ${pos.x}% × ${pos.y}%`;
                    if (btn.placement.includes("header"))
                      return "Header (fixed slot)";
                    return "Drag onto preview to place";
                  })()}
                </p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={btn.enabled}
                    onChange={(e) => {
                      markSiteDirty();
                      setSiteConfig((c) => {
                        const buttons = [...c.buttons];
                        buttons[i] = { ...buttons[i], enabled: e.target.checked };
                        return { ...c, buttons };
                      });
                    }}
                  />
                  Enabled
                </label>
                <input
                  value={btn.label}
                  onChange={(e) => {
                    markSiteDirty();
                    setSiteConfig((c) => {
                      const buttons = [...c.buttons];
                      buttons[i] = { ...buttons[i], label: e.target.value };
                      return { ...c, buttons };
                    });
                  }}
                  placeholder="Label"
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                />
                <input
                  value={btn.href}
                  onChange={(e) => {
                    markSiteDirty();
                    setSiteConfig((c) => {
                      const buttons = [...c.buttons];
                      buttons[i] = { ...buttons[i], href: e.target.value };
                      return { ...c, buttons };
                    });
                  }}
                  placeholder="/purchase"
                  className="w-full rounded border border-gray-300 px-2 py-1 font-mono text-xs"
                />
                <select
                  value={btn.action}
                  onChange={(e) => {
                    markSiteDirty();
                    setSiteConfig((c) => {
                      const buttons = [...c.buttons];
                      buttons[i] = {
                        ...buttons[i],
                        action: e.target.value as "link" | "checkout",
                      };
                      return { ...c, buttons };
                    });
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                >
                  <option value="link">Link</option>
                  <option value="checkout">Stripe checkout</option>
                </select>
                <select
                  value={btn.style}
                  onChange={(e) => {
                    markSiteDirty();
                    setSiteConfig((c) => {
                      const buttons = [...c.buttons];
                      buttons[i] = {
                        ...buttons[i],
                        style: e.target.value as "primary" | "outline",
                      };
                      return { ...c, buttons };
                    });
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                >
                  <option value="primary">Primary</option>
                  <option value="outline">Outline</option>
                </select>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => {
                    markSiteDirty();
                    setSiteConfig((c) => ({
                      ...c,
                      buttons: c.buttons.filter((_, j) => j !== i),
                    }));
                  }}
                >
                  Remove button
                </button>
              </div>
              </DraggableButtonHandle>
            ))
          )}
        </div>
      );
    }

    if (tab !== "text") return null;

    return (
      <PageTextFields
        template={pageTemplate}
        siteText={siteConfig.colors.text}
        title={title}
        subtitle={subtitle}
        body={body}
        textColors={textColors}
        onTitleChange={setTitle}
        onSubtitleChange={setSubtitle}
        onBodyChange={setBody}
        onTextColorChange={(slotId, color) =>
          setTextColors((prev) => ({ ...prev, [slotId]: color }))
        }
        showPageSettings={!page.isSystem}
        pageEnabled={pageEnabled}
        showInNav={showInNav}
        onPageEnabledChange={setPageEnabled}
        onShowInNavChange={setShowInNav}
        bodyHint={selected === "home" ? HOME_BODY_HINT : undefined}
        extraFields={
          <>
            {page.isSystem && (
              <p className="text-xs text-gray-500">
                Path: {draft?.path} · Template: {draft?.template}
                {isMapPage
                  ? " · Shop cards: Coffee shops tab"
                  : pageSlug === "learn-more"
                    ? " · Team photos & bios: Photos tab"
                    : " (fixed layout)"}
              </p>
            )}
            {!page.isSystem && (
              <>
                <p className="text-xs text-gray-500">
                  Path: {draft?.path} · Template: {draft?.template}
                </p>
                <button
                  type="button"
                  onClick={handleDeletePage}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete this page
                </button>
              </>
            )}
          </>
        }
      />
    );
  }, [
    tab,
    isMapPage,
    textColors,
    initialCoffeeShops,
    siteConfig,
    page,
    pageContext,
    pageTemplate,
    pageButtons,
    pageNavEntries,
    pageImageFields,
    draft,
    title,
    subtitle,
    body,
    pageEnabled,
    showInNav,
    selected,
    livePath,
    pageSlug,
    canvasButtons,
  ]);

  if (!page) return null;

  const leftCol = leftPanelOpen ? "13.5rem" : "0rem";
  const rightCol = rightPanelOpen
    ? isMapPage && tab === "shops"
      ? "20rem"
      : "18rem"
    : "0rem";

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-gray-200">
      <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-gray-300 bg-white px-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setLeftPanelOpen((o) => !o)}
            className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-white"
            aria-expanded={leftPanelOpen}
          >
            {leftPanelOpen ? "Hide pages" : "Pages"}
          </button>
          <button
            type="button"
            onClick={() => setRightPanelOpen((o) => !o)}
            className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-white"
            aria-expanded={rightPanelOpen}
          >
            {rightPanelOpen ? "Hide panel" : "Edit"}
          </button>
          <span className="hidden truncate text-xs text-gray-500 sm:inline">
            {getPageEditorLabel(pageContext!)}
            {totalDirty > 0
              ? ` · ${totalDirty} unsaved`
              : " · up to date"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href={livePath}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            View live
          </Link>
          {totalDirty > 1 && (
            <button
              type="button"
              onClick={handlePublishAll}
              disabled={publishing}
              className="hidden rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 sm:inline"
            >
              Publish all
            </button>
          )}
          <button
            type="button"
            onClick={handleDiscard}
            disabled={discarding || totalDirty === 0}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-60 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            {discarding ? "Reverting…" : "Discard"}
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-60 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || totalDirty === 0}
            className="rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-60 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </header>

      <div
        className="grid min-h-0 flex-1 transition-[grid-template-columns] duration-200 ease-out"
        style={{
          gridTemplateColumns: `${leftCol} minmax(0, 1fr) ${rightCol}`,
        }}
      >
        <aside
          className={`min-w-0 overflow-hidden border-r border-gray-300 bg-gray-50 transition-opacity ${
            leftPanelOpen ? "overflow-y-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="w-[13.5rem] p-3">
            <p className="px-1 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Page
            </p>
            <ul className="mt-1 space-y-0.5">
              {pages.map((p) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(p.slug);
                      syncForm(p);
                      if (p.slug === "map") {
                        setTab("shops");
                        setRightPanelOpen(true);
                      }
                    }}
                    className={`flex w-full items-center justify-between gap-1 rounded-lg px-2 py-2 text-left text-xs ${
                      selected === p.slug
                        ? "bg-white font-medium text-brand-green shadow-sm"
                        : "text-gray-700 hover:bg-white/80"
                    }`}
                  >
                    <span className="truncate">{p.slug}</span>
                    {(p.hasUnpublishedChanges || false) && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-1">
              <input
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                placeholder="New page title"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={handleCreatePage}
                className="w-full rounded border border-dashed border-gray-300 py-1 text-xs text-gray-600 hover:bg-white"
              >
                + Add page
              </button>
            </div>

            <p className="mt-5 px-1 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Customize
            </p>
            <div className="mt-1 space-y-0.5">
              {customizeTabs.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={tabClass(id)}
                  onClick={() => {
                    setTab(id);
                    setRightPanelOpen(true);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="relative min-h-0 min-w-0 bg-neutral-800">
          <EditorPreviewFrame
            previewPath={previewPath}
            previewKey={previewKey}
            buttonEditEnabled={tab === "buttons"}
            canvasButtons={canvasButtons}
            onCanvasPosition={handleCanvasPosition}
            imageEditEnabled={tab === "photos"}
            canvasImages={placedImages}
            onImageCanvasPosition={handleImageCanvasPosition}
          />
        </div>

        <aside
          className={`flex min-w-0 flex-col overflow-hidden border-l border-gray-300 bg-white transition-opacity ${
            rightPanelOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div
            className={`flex min-h-0 w-full flex-col ${
              isMapPage && tab === "shops" ? "w-[20rem]" : "w-[18rem]"
            }`}
          >
            <div className="shrink-0 border-b border-gray-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {panelTitle}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {rightPanel}
              {message && tab !== "shops" && (
                <p className="mt-3 text-xs text-green-700" role="status">
                  {message}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
