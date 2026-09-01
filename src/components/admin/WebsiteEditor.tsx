"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EditorCanvas } from "@/components/admin/website-editor/EditorCanvas";
import { SectionList } from "@/components/admin/website-editor/SectionList";
import { SectionSettings } from "@/components/admin/website-editor/SectionSettings";
import { getPageEditorLabel } from "@/components/admin/website-editor/page-context";
import type { CoffeeShopRow } from "@/lib/coffee-shops";
import { getPageLivePath } from "@/lib/pages";
import {
  applyFlattenedImages,
  createSection,
  flattenSectionsToPageFields,
  moveSection,
  parsePageSections,
  resolvePageSections,
  type PageSection,
  type PageSectionType,
} from "@/lib/pages/sections";
import type { SiteConfig } from "@/lib/site-config";
import { migrateSiteConfigButtons } from "@/lib/site-config";

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
  sections?: string;
  draftSections?: string | null;
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

function sectionsForPage(nextPage: AdminPage, config: SiteConfig): PageSection[] {
  const d = draftPageFields(nextPage);
  return resolvePageSections(
    {
      slug: nextPage.slug,
      template: d.template,
      title: d.title,
      subtitle: d.subtitle || null,
      body: d.body,
      storedSections: parsePageSections(
        nextPage.draftSections ?? nextPage.sections,
      ),
    },
    config,
  );
}

type WebsiteEditorProps = {
  pages: AdminPage[];
  initialSiteConfig: SiteConfig;
  siteHasChanges: boolean;
  initialCoffeeShops: CoffeeShopRow[];
  mapEmbedUrl: string;
};

export function WebsiteEditor({
  pages: initialPages,
  initialSiteConfig,
  siteHasChanges: initialSiteChanges,
  initialCoffeeShops,
  mapEmbedUrl,
}: WebsiteEditorProps) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [siteConfig, setSiteConfig] = useState(() =>
    migrateSiteConfigButtons(initialSiteConfig),
  );
  const [siteDirty, setSiteDirty] = useState(initialSiteChanges);
  const [selected, setSelected] = useState(initialPages[0]?.slug ?? "home");
  const [sections, setSections] = useState<PageSection[]>(() =>
    initialPages[0]
      ? sectionsForPage(
          initialPages[0],
          migrateSiteConfigButtons(initialSiteConfig),
        )
      : [],
  );
  const [selection, setSelection] = useState("__page");
  const [pageEnabled, setPageEnabled] = useState(true);
  const [showInNav, setShowInNav] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [shopsVersion, setShopsVersion] = useState(0);

  const page = pages.find((p) => p.slug === selected) ?? pages[0];
  const draft = page ? draftPageFields(page) : null;
  const pageTemplate = draft?.template ?? page?.template ?? "content";

  const livePath = page
    ? getPageLivePath({
        slug: page.slug,
        path: page.path,
        template: page.template,
      })
    : "/";

  const pageDirtyCount = pages.filter((p) => p.hasUnpublishedChanges).length;
  const totalDirty = pageDirtyCount + (siteDirty ? 1 : 0);

  const resolvedPage = useMemo(() => {
    if (!page || !draft) return null;
    return {
      slug: page.slug,
      path: draft.path ?? page.path ?? "/",
      template: pageTemplate,
      enabled: pageEnabled,
      showInNav,
      title: draft.title,
      subtitle: draft.subtitle || null,
      body: draft.body,
      placedImages: [],
      textColorOverrides: {},
      sections,
    };
  }, [page, draft, pageTemplate, pageEnabled, showInNav, sections]);

  const selectedSection = sections.find((s) => s.id === selection) ?? null;

  const loadPage = useCallback(
    (nextPage: AdminPage, config: SiteConfig) => {
      const d = draftPageFields(nextPage);
      setPageEnabled(d.enabled);
      setShowInNav(d.showInNav);
      setSections(sectionsForPage(nextPage, config));
      setSelection("__page");
      setMessage(null);
    },
    [],
  );

  useEffect(() => {
    if (page) loadPage(page, siteConfig);
    // Only re-hydrate when the selected page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.slug]);

  function markSiteDirty() {
    setSiteDirty(true);
  }

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
    if (!page) return;
    setSaving(true);
    setMessage(null);
    try {
      const flat = flattenSectionsToPageFields(sections, pageTemplate);
      const nextConfig = applyFlattenedImages(siteConfig, flat);
      await fetch("/api/admin/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: page.slug,
          title: flat.title || page.title,
          subtitle: flat.subtitle,
          body: flat.body,
          sections,
          enabled: pageEnabled,
          showInNav,
        }),
      });
      const listRes = await fetch("/api/admin/pages");
      if (listRes.ok) setPages(await listRes.json());
      await saveSiteDraft(nextConfig);
      setMessage("Draft saved");
      router.refresh();
    } catch (err) {
      setMessage("Failed to save draft");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setMessage(null);
    try {
      await handleSaveDraft();
      await fetch("/api/admin/pages/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page ? { slug: page.slug } : {}),
      });
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
      router.refresh();
    } catch {
      setMessage("Failed to publish");
    } finally {
      setPublishing(false);
    }
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
      let publishedConfig = siteConfig;
      if (siteRes.ok) {
        const s = (await siteRes.json()) as { published: SiteConfig };
        publishedConfig = s.published;
        setSiteConfig(s.published);
        await saveSiteDraft(s.published);
        setSiteDirty(false);
      }
      const listRes = await fetch("/api/admin/pages");
      if (listRes.ok) {
        const list = (await listRes.json()) as AdminPage[];
        setPages(list);
        const current = list.find((p) => p.slug === selected);
        if (current) loadPage(current, publishedConfig);
      }
      setMessage("Reverted to live version");
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

  function handleSectionChange(next: PageSection) {
    setSections((list) => list.map((s) => (s.id === next.id ? next : s)));
  }

  function handleAddSection(type: PageSectionType) {
    const created = createSection(type);
    setSections((list) => [...list, created]);
    setSelection(created.id);
    setRightPanelOpen(true);
  }

  if (!page || !resolvedPage) return null;

  const leftCol = leftPanelOpen ? "13.5rem" : "0rem";
  const rightCol = rightPanelOpen ? "18rem" : "0rem";

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-gray-200">
      <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-gray-300 bg-white px-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setLeftPanelOpen((o) => !o)}
            className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-white"
          >
            {leftPanelOpen ? "Hide sections" : "Sections"}
          </button>
          <button
            type="button"
            onClick={() => setRightPanelOpen((o) => !o)}
            className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-white"
          >
            {rightPanelOpen ? "Hide settings" : "Settings"}
          </button>
          <span className="hidden truncate text-xs text-gray-500 sm:inline">
            {getPageEditorLabel({
              slug: page.slug,
              path: draft?.path ?? page.path,
              template: pageTemplate,
            })}
            {totalDirty > 0 ? ` · ${totalDirty} unsaved` : " · up to date"}
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
            disabled={publishing}
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
                    onClick={() => setSelected(p.slug)}
                    className={`flex w-full items-center justify-between gap-1 rounded-lg px-2 py-2 text-left text-xs ${
                      selected === p.slug
                        ? "bg-white font-medium text-brand-green shadow-sm"
                        : "text-gray-700 hover:bg-white/80"
                    }`}
                  >
                    <span className="truncate">{p.slug}</span>
                    {p.hasUnpublishedChanges ? (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    ) : null}
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

            <button
              type="button"
              onClick={() => {
                setSelection("__page");
                setRightPanelOpen(true);
              }}
              className={`mt-4 block w-full rounded-lg px-2 py-2 text-left text-xs ${
                selection === "__page"
                  ? "bg-white font-medium text-brand-green shadow-sm"
                  : "text-gray-700 hover:bg-white/80"
              }`}
            >
              Page settings
            </button>
            <button
              type="button"
              onClick={() => {
                setSelection("__header");
                setRightPanelOpen(true);
              }}
              className={`mt-0.5 block w-full rounded-lg px-2 py-2 text-left text-xs ${
                selection === "__header"
                  ? "bg-white font-medium text-brand-green shadow-sm"
                  : "text-gray-700 hover:bg-white/80"
              }`}
            >
              Header
            </button>

            <div className="mt-3">
              <SectionList
                sections={sections}
                selectedId={selection}
                onSelect={(id) => {
                  setSelection(id);
                  setRightPanelOpen(true);
                }}
                onReorder={(from, to) => setSections((list) => moveSection(list, from, to))}
                onAdd={handleAddSection}
                onToggle={(id) =>
                  setSections((list) =>
                    list.map((s) =>
                      s.id === id ? { ...s, enabled: !s.enabled } : s,
                    ),
                  )
                }
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setSelection("__footer");
                setRightPanelOpen(true);
              }}
              className={`mt-2 block w-full rounded-lg px-2 py-2 text-left text-xs ${
                selection === "__footer"
                  ? "bg-white font-medium text-brand-green shadow-sm"
                  : "text-gray-700 hover:bg-white/80"
              }`}
            >
              Footer
            </button>
            <button
              type="button"
              onClick={() => {
                setSelection("__colors");
                setRightPanelOpen(true);
              }}
              className={`mt-0.5 block w-full rounded-lg px-2 py-2 text-left text-xs ${
                selection === "__colors"
                  ? "bg-white font-medium text-brand-green shadow-sm"
                  : "text-gray-700 hover:bg-white/80"
              }`}
            >
              Colors
            </button>
          </div>
        </aside>

        <div className="relative min-h-0 min-w-0 bg-neutral-300">
          <EditorCanvas
            key={`${page.slug}-${shopsVersion}`}
            siteConfig={siteConfig}
            page={resolvedPage}
            sections={sections}
            shops={initialCoffeeShops}
            mapEmbedUrl={mapEmbedUrl}
            selectedId={selection}
            onSelect={(id) => {
              setSelection(id);
              setRightPanelOpen(true);
            }}
          />
        </div>

        <aside
          className={`flex min-w-0 flex-col overflow-hidden border-l border-gray-300 bg-white transition-opacity ${
            rightPanelOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="flex min-h-0 w-[18rem] flex-col">
            <div className="shrink-0 border-b border-gray-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Settings
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <SectionSettings
                selection={selection}
                section={selectedSection}
                siteConfig={siteConfig}
                shops={initialCoffeeShops}
                pageEnabled={pageEnabled}
                showInNav={showInNav}
                isSystemPage={page.isSystem}
                onPageEnabledChange={setPageEnabled}
                onShowInNavChange={setShowInNav}
                onDeletePage={handleDeletePage}
                onSectionChange={handleSectionChange}
                onSiteConfigChange={(config) => {
                  markSiteDirty();
                  setSiteConfig(config);
                }}
                onAfterShopsChange={() => setShopsVersion((v) => v + 1)}
              />
              {message ? (
                <p className="mt-3 text-xs text-green-700" role="status">
                  {message}
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
