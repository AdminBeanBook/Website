"use client";

import { CoffeeShopsManager } from "@/components/admin/CoffeeShopsManager";
import { ImageField } from "@/components/admin/website-editor/ImageField";
import { LearnMoreTeamEditor } from "@/components/admin/website-editor/LearnMoreTeamEditor";
import type { CoffeeShopRow } from "@/lib/coffee-shops";
import {
  createBlock,
  getSectionBlocks,
  getTeamMembers,
  moveBlock,
  sectionLabel,
  setSectionBlocks,
  type PageSection,
  type SectionBlock,
  type SectionBlockType,
} from "@/lib/pages/sections";
import { BRAND_COLOR_FIELDS } from "@/lib/site-config/color-fields";
import { SITE_TEXT_COLOR_FIELDS } from "@/lib/site-config/text-colors";
import type { SiteConfig } from "@/lib/site-config";

const inputClass =
  "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

type SectionSettingsProps = {
  selection: string;
  section: PageSection | null;
  siteConfig: SiteConfig;
  shops: CoffeeShopRow[];
  pageEnabled: boolean;
  showInNav: boolean;
  isSystemPage: boolean;
  onPageEnabledChange: (value: boolean) => void;
  onShowInNavChange: (value: boolean) => void;
  onDeletePage?: () => void;
  onSectionChange: (section: PageSection) => void;
  onSiteConfigChange: (config: SiteConfig) => void;
  onAfterShopsChange?: () => void;
};

function updateSetting(
  section: PageSection,
  key: string,
  value: unknown,
): PageSection {
  return { ...section, settings: { ...section.settings, [key]: value } };
}

function BlocksEditor({
  section,
  onSectionChange,
}: {
  section: PageSection;
  onSectionChange: (section: PageSection) => void;
}) {
  const blocks = getSectionBlocks(section);

  function commit(next: SectionBlock[]) {
    onSectionChange(setSectionBlocks(section, next));
  }

  function updateBlock(id: string, settings: Record<string, unknown>) {
    commit(
      blocks.map((block) =>
        block.id === id ? { ...block, settings: { ...block.settings, ...settings } } : block,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-700">Content</p>
      <p className="text-[11px] text-gray-500">
        Use the arrows to move headings, text, and buttons up or down inside this
        section.
      </p>
      {blocks.map((block, index) => (
        <div key={block.id} className="space-y-2 rounded border border-gray-200 p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {block.type}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => commit(moveBlock(blocks, index, index - 1))}
                className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] disabled:opacity-30"
              >
                Up
              </button>
              <button
                type="button"
                disabled={index === blocks.length - 1}
                onClick={() => commit(moveBlock(blocks, index, index + 1))}
                className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] disabled:opacity-30"
              >
                Down
              </button>
              <button
                type="button"
                className="text-[11px] text-red-600"
                onClick={() => commit(blocks.filter((item) => item.id !== block.id))}
              >
                Remove
              </button>
            </div>
          </div>
          {block.type === "button" ? (
            <>
              <input
                value={String(block.settings.label ?? "")}
                onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                className={inputClass}
                placeholder="Label"
              />
              <input
                value={String(block.settings.href ?? "")}
                onChange={(e) => updateBlock(block.id, { href: e.target.value })}
                className={`${inputClass} font-mono text-xs`}
                placeholder="/purchase"
              />
              <select
                value={String(block.settings.action ?? "link")}
                onChange={(e) => updateBlock(block.id, { action: e.target.value })}
                className={inputClass}
              >
                <option value="link">Link</option>
                <option value="checkout">Stripe checkout</option>
              </select>
              <select
                value={String(block.settings.style ?? "primary")}
                onChange={(e) => updateBlock(block.id, { style: e.target.value })}
                className={inputClass}
              >
                <option value="primary">Primary</option>
                <option value="outline">Outline</option>
              </select>
            </>
          ) : (
            <textarea
              value={String(block.settings.text ?? "")}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              rows={block.type === "heading" ? 2 : 4}
              className={inputClass}
              placeholder={block.type === "heading" ? "Heading" : "Text"}
            />
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {(["heading", "text", "button"] as SectionBlockType[]).map((type) => (
          <button
            key={type}
            type="button"
            className="text-xs text-brand-green hover:underline"
            onClick={() => commit([...blocks, createBlock(type)])}
          >
            + {type === "heading" ? "Heading" : type === "text" ? "Text" : "Button"}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorsPanel({
  siteConfig,
  onSiteConfigChange,
}: {
  siteConfig: SiteConfig;
  onSiteConfigChange: (config: SiteConfig) => void;
}) {
  return (
    <div className="space-y-3">
      {BRAND_COLOR_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {label}
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={siteConfig.colors[key]}
              onChange={(e) =>
                onSiteConfigChange({
                  ...siteConfig,
                  colors: { ...siteConfig.colors, [key]: e.target.value },
                })
              }
              className="h-9 w-12 cursor-pointer rounded border border-gray-300"
            />
            <input
              value={siteConfig.colors[key]}
              onChange={(e) =>
                onSiteConfigChange({
                  ...siteConfig,
                  colors: { ...siteConfig.colors, [key]: e.target.value },
                })
              }
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
              onChange={(e) =>
                onSiteConfigChange({
                  ...siteConfig,
                  colors: {
                    ...siteConfig.colors,
                    text: { ...siteConfig.colors.text, [key]: e.target.value },
                  },
                })
              }
              className="h-9 w-12 cursor-pointer rounded border border-gray-300"
            />
            <input
              value={siteConfig.colors.text[key]}
              onChange={(e) =>
                onSiteConfigChange({
                  ...siteConfig,
                  colors: {
                    ...siteConfig.colors,
                    text: { ...siteConfig.colors.text, [key]: e.target.value },
                  },
                })
              }
              className="flex-1 rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function HeaderPanel({
  siteConfig,
  onSiteConfigChange,
}: {
  siteConfig: SiteConfig;
  onSiteConfigChange: (config: SiteConfig) => void;
}) {
  const headerButtons = siteConfig.buttons
    .map((btn, index) => ({ btn, index }))
    .filter(({ btn }) => btn.placement.includes("header"));

  return (
    <div className="space-y-4">
      <ImageField
        label="Logo"
        value={siteConfig.images.logo}
        onChange={(url) =>
          onSiteConfigChange({
            ...siteConfig,
            images: { ...siteConfig.images, logo: url },
          })
        }
      />
      <p className="text-[11px] text-gray-500">
        Header buttons live in the nav bar only. Page buttons are inside each
        section — use Up/Down there to reorder them.
      </p>
      <p className="text-xs font-semibold text-gray-700">Menu links</p>
      {siteConfig.nav.map((link, i) => (
        <div key={link.id} className="rounded border border-gray-200 p-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={link.enabled}
              disabled={link.system}
              onChange={(e) => {
                const nav = [...siteConfig.nav];
                nav[i] = { ...nav[i], enabled: e.target.checked };
                onSiteConfigChange({ ...siteConfig, nav });
              }}
            />
            <span className="font-medium">{link.label}</span>
          </label>
          <input
            value={link.label}
            onChange={(e) => {
              const nav = [...siteConfig.nav];
              nav[i] = { ...nav[i], label: e.target.value };
              onSiteConfigChange({ ...siteConfig, nav });
            }}
            className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-xs"
          />
        </div>
      ))}
      <p className="text-xs font-semibold text-gray-700">Header buttons</p>
      {headerButtons.map(({ btn, index }) => (
        <div key={btn.id} className="space-y-2 rounded border border-gray-200 p-2">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={btn.enabled}
              onChange={(e) => {
                const buttons = [...siteConfig.buttons];
                buttons[index] = { ...buttons[index], enabled: e.target.checked };
                onSiteConfigChange({ ...siteConfig, buttons });
              }}
            />
            Enabled
          </label>
          <input
            value={btn.label}
            onChange={(e) => {
              const buttons = [...siteConfig.buttons];
              buttons[index] = { ...buttons[index], label: e.target.value };
              onSiteConfigChange({ ...siteConfig, buttons });
            }}
            className={inputClass}
          />
        </div>
      ))}
    </div>
  );
}

export function SectionSettings({
  selection,
  section,
  siteConfig,
  shops,
  pageEnabled,
  showInNav,
  isSystemPage,
  onPageEnabledChange,
  onShowInNavChange,
  onDeletePage,
  onSectionChange,
  onSiteConfigChange,
  onAfterShopsChange,
}: SectionSettingsProps) {
  if (selection === "__colors") {
    return (
      <ColorsPanel
        siteConfig={siteConfig}
        onSiteConfigChange={onSiteConfigChange}
      />
    );
  }

  if (selection === "__header") {
    return (
      <HeaderPanel
        siteConfig={siteConfig}
        onSiteConfigChange={onSiteConfigChange}
      />
    );
  }

  if (selection === "__footer") {
    return (
      <p className="text-xs text-gray-500">
        Footer links come from the header menu. Edit them under Header.
      </p>
    );
  }

  if (selection === "__page") {
    return (
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pageEnabled}
            disabled={isSystemPage}
            onChange={(e) => onPageEnabledChange(e.target.checked)}
          />
          Page enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInNav}
            onChange={(e) => onShowInNavChange(e.target.checked)}
          />
          Show in navigation
        </label>
        {!isSystemPage && onDeletePage ? (
          <button
            type="button"
            onClick={onDeletePage}
            className="text-xs text-red-600 hover:underline"
          >
            Delete this page
          </button>
        ) : (
          <p className="text-xs text-gray-500">System page — layout is fixed, sections can still move.</p>
        )}
      </div>
    );
  }

  if (!section) {
    return (
      <p className="text-xs text-gray-500">
        Select a section on the left, or click it on the preview.
      </p>
    );
  }

  if (section.type === "shop-directory") {
    return (
      <div className="space-y-4">
        <label className="block text-xs font-medium text-gray-600">Heading</label>
        <input
          value={String(section.settings.heading ?? "")}
          onChange={(e) =>
            onSectionChange(updateSetting(section, "heading", e.target.value))
          }
          className={inputClass}
        />
        <label className="block text-xs font-medium text-gray-600">Subtext</label>
        <input
          value={String(section.settings.subtext ?? "")}
          onChange={(e) =>
            onSectionChange(updateSetting(section, "subtext", e.target.value))
          }
          className={inputClass}
        />
        <CoffeeShopsManager
          initialShops={shops}
          variant="sidebar"
          onAfterChange={onAfterShopsChange}
        />
      </div>
    );
  }

  if (section.type === "team") {
    return (
      <LearnMoreTeamEditor
        members={getTeamMembers(section)}
        onChange={(members) =>
          onSectionChange(updateSetting(section, "members", members))
        }
      />
    );
  }

  if (section.type === "about") {
    return (
      <p className="text-xs text-gray-500">
        This is the Bean Book story block. Drag it in the section list to move
        it. Heading lives in the Hero section above.
      </p>
    );
  }

  if (section.type === "contact-form") {
    return (
      <p className="text-xs text-gray-500">
        The contact form is an app block. Messages still arrive in Admin →
        Messages.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {sectionLabel(section.type)}
      </p>
      {section.type === "hero" ? (
        <ImageField
          label="Background image"
          value={String(section.settings.backgroundImage ?? "")}
          onChange={(url) =>
            onSectionChange(updateSetting(section, "backgroundImage", url))
          }
        />
      ) : null}
      {section.type === "hero" ||
      section.type === "rich-text" ||
      section.type === "cta" ? (
        <BlocksEditor section={section} onSectionChange={onSectionChange} />
      ) : null}
      {section.type === "product" ? (
        <>
          <label className="block text-xs font-medium text-gray-600">Title</label>
          <input
            value={String(section.settings.title ?? "")}
            onChange={(e) =>
              onSectionChange(updateSetting(section, "title", e.target.value))
            }
            className={inputClass}
          />
          <ImageField
            label="Product image"
            value={String(section.settings.image ?? "")}
            onChange={(url) =>
              onSectionChange(updateSetting(section, "image", url))
            }
          />
          <label className="block text-xs font-medium text-gray-600">Price</label>
          <input
            value={String(section.settings.priceLabel ?? "")}
            onChange={(e) =>
              onSectionChange(updateSetting(section, "priceLabel", e.target.value))
            }
            className={inputClass}
          />
          <label className="block text-xs font-medium text-gray-600">
            Fine print
          </label>
          <textarea
            value={String(section.settings.finePrint ?? "")}
            onChange={(e) =>
              onSectionChange(updateSetting(section, "finePrint", e.target.value))
            }
            rows={2}
            className={inputClass}
          />
        </>
      ) : null}
      {section.type === "gallery" ? (
        <div className="space-y-3">
          {(Array.isArray(section.settings.images)
            ? section.settings.images.map(String)
            : [""]
          ).map((url, i) => (
            <div key={i}>
              <ImageField
                label={`Image ${i + 1}`}
                value={url}
                onChange={(next) => {
                  const images = Array.isArray(section.settings.images)
                    ? section.settings.images.map(String)
                    : [""];
                  images[i] = next;
                  onSectionChange(updateSetting(section, "images", images));
                }}
              />
              <button
                type="button"
                className="mt-1 text-xs text-red-600"
                onClick={() => {
                  const images = (
                    Array.isArray(section.settings.images)
                      ? section.settings.images.map(String)
                      : []
                  ).filter((_, j) => j !== i);
                  onSectionChange(updateSetting(section, "images", images));
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
              const images = Array.isArray(section.settings.images)
                ? section.settings.images.map(String)
                : [];
              onSectionChange(updateSetting(section, "images", [...images, ""]));
            }}
          >
            + Add image
          </button>
        </div>
      ) : null}
    </div>
  );
}
