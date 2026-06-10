import type {
  PageButtonPosition,
  SiteButtonConfig,
  SiteConfig,
} from "@/lib/site-config/types";

export type { PageButtonPosition };

export const PAGE_CANVAS_ID = "bb-page-canvas";

/** Map preview/live pathname to page slug used in the CMS. */
export function pathnameToPageSlug(pathname: string): string {
  const stripped = pathname.replace(/^\/preview/, "") || "/";
  if (stripped === "/") return "home";
  if (stripped.startsWith("/p/")) return stripped.slice(3).split("/")[0] ?? "home";
  return stripped.replace(/^\//, "").split("/")[0] ?? "home";
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}

export function getButtonPagePosition(
  button: SiteButtonConfig,
  pageSlug: string,
): PageButtonPosition | null {
  const pos = button.pagePositions?.[pageSlug];
  if (!pos) return null;
  return { x: clampPercent(pos.x), y: clampPercent(pos.y) };
}

export function buttonOnPage(
  button: SiteButtonConfig,
  pageSlug: string,
): boolean {
  if (!button.enabled) return false;
  if (getButtonPagePosition(button, pageSlug)) return true;
  return false;
}

export function getFreeButtonsForPage(
  config: SiteConfig,
  pageSlug: string,
): SiteButtonConfig[] {
  return config.buttons.filter((b) => {
    if (!buttonOnPage(b, pageSlug)) return false;
    // Purchase page book card starts checkout; skip overlapping overlay buttons.
    if (pageSlug === "purchase" && b.action === "checkout") return false;
    return true;
  });
}

/** Buttons using fixed slots (e.g. header), excluding free-positioned on this page. */
export function getSlotButtonsForPlacement(
  config: SiteConfig,
  placement: string,
  pageSlug: string,
): SiteButtonConfig[] {
  return config.buttons.filter(
    (b) =>
      b.enabled &&
      b.placement.includes(placement) &&
      !b.pagePositions?.[pageSlug],
  );
}

const SLOT_DEFAULT_POSITIONS: Record<
  string,
  Record<string, PageButtonPosition>
> = {
  home: {
    "home-hero": { x: 50, y: 62 },
    "home-content": { x: 50, y: 72 },
  },
  purchase: {
    purchase: { x: 50, y: 58 },
  },
};

/** Convert legacy slot placements into free positions (one-time shape for editor). */
export function migrateButtonPositions(
  button: SiteButtonConfig,
): SiteButtonConfig {
  if (button.pagePositions && Object.keys(button.pagePositions).length > 0) {
    return button;
  }

  const pagePositions: Record<string, PageButtonPosition> = {};
  const keepPlacements: string[] = [];

  for (const placement of button.placement) {
    if (placement === "header") {
      keepPlacements.push(placement);
      continue;
    }
    let mapped = false;
    for (const [pageSlug, slots] of Object.entries(SLOT_DEFAULT_POSITIONS)) {
      const pos = slots[placement];
      if (pos) {
        pagePositions[pageSlug] = pos;
        mapped = true;
        break;
      }
    }
    if (!mapped) keepPlacements.push(placement);
  }

  if (Object.keys(pagePositions).length === 0) return button;

  return {
    ...button,
    placement: keepPlacements,
    pagePositions,
  };
}

/** Legacy defaults overlapped the hero title or sat under the white section. */
function nudgeLegacyHomeButtonPositions(
  buttons: SiteButtonConfig[],
): SiteButtonConfig[] {
  const nudges: Record<
    string,
    { from: PageButtonPosition; to: PageButtonPosition }
  > = {
    "btn-home-hero": { from: { x: 50, y: 28 }, to: { x: 50, y: 62 } },
    "btn-home-learn": { from: { x: 50, y: 52 }, to: { x: 50, y: 72 } },
  };

  return buttons.map((button) => {
    const nudge = nudges[button.id];
    const home = button.pagePositions?.home;
    if (!nudge || !home) return button;
    if (home.x !== nudge.from.x || home.y !== nudge.from.y) return button;
    return {
      ...button,
      pagePositions: { ...button.pagePositions, home: nudge.to },
    };
  });
}

function removePurchaseCheckoutOverlay(
  buttons: SiteButtonConfig[],
): SiteButtonConfig[] {
  return buttons.map((button) => {
    if (!button.pagePositions?.purchase) return button;

    const isPurchaseCheckout =
      button.action === "checkout" || button.id === "btn-purchase-checkout";
    if (!isPurchaseCheckout) return button;

    const { purchase: _purchase, ...otherPositions } = button.pagePositions;
    const pagePositions =
      Object.keys(otherPositions).length > 0 ? otherPositions : undefined;

    return {
      ...button,
      enabled: button.id === "btn-purchase-checkout" ? false : button.enabled,
      pagePositions,
    };
  });
}

export function migrateSiteConfigButtons(config: SiteConfig): SiteConfig {
  return {
    ...config,
    buttons: removePurchaseCheckoutOverlay(
      nudgeLegacyHomeButtonPositions(
        config.buttons.map(migrateButtonPositions),
      ),
    ),
  };
}

export function setButtonPagePosition(
  button: SiteButtonConfig,
  pageSlug: string,
  position: PageButtonPosition,
): SiteButtonConfig {
  const pagePositions = { ...button.pagePositions, [pageSlug]: position };
  const placement = button.placement.filter((p) => {
    if (p === "header") return true;
    const slots = SLOT_DEFAULT_POSITIONS[pageSlug];
    return !slots || !(p in slots);
  });
  return { ...button, pagePositions, placement };
}

export function applyConfigButtonPosition(
  config: SiteConfig,
  buttonId: string,
  pageSlug: string,
  position: PageButtonPosition,
): SiteConfig {
  const buttons = config.buttons.map((b) =>
    b.id === buttonId ? setButtonPagePosition(b, pageSlug, position) : b,
  );
  return { ...config, buttons };
}

export function applyConfigNewButtonAt(
  config: SiteConfig,
  pageSlug: string,
  position: PageButtonPosition,
  template: string,
): SiteConfig {
  return {
    ...config,
    buttons: [
      ...config.buttons,
      {
        id: `btn-${Date.now()}`,
        label: "New button",
        href: "/purchase",
        style: "primary",
        action: "link",
        placement: [],
        pagePositions: { [pageSlug]: position },
        enabled: true,
      },
    ],
  };
}
