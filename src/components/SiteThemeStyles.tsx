import { hexToRgbChannels } from "@/lib/site-config/colors";
import type { BrandColors } from "@/lib/site-config/types";

export function SiteThemeStyles({ colors }: { colors: BrandColors }) {
  const css = `:root {
  --bb-green: ${colors.green};
  --bb-header: ${colors.header};
  --bb-beige: ${colors.beige};
  --bb-cream: ${colors.cream};
  --bb-accent: ${colors.accent};
  --bb-text: ${colors.text.body};
  --bb-text-heading: ${colors.text.heading};
  --bb-text-body: ${colors.text.body};
  --bb-text-muted: ${colors.text.muted};
  --bb-text-link: ${colors.text.link};
  --bb-green-rgb: ${hexToRgbChannels(colors.green)};
  --bb-header-rgb: ${hexToRgbChannels(colors.header)};
  --bb-beige-rgb: ${hexToRgbChannels(colors.beige)};
  --bb-cream-rgb: ${hexToRgbChannels(colors.cream)};
  --bb-accent-rgb: ${hexToRgbChannels(colors.accent)};
  --bb-text-rgb: ${hexToRgbChannels(colors.text.body)};
  --bb-text-heading-rgb: ${hexToRgbChannels(colors.text.heading)};
  --bb-text-body-rgb: ${hexToRgbChannels(colors.text.body)};
  --bb-text-muted-rgb: ${hexToRgbChannels(colors.text.muted)};
  --bb-text-link-rgb: ${hexToRgbChannels(colors.text.link)};
}`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
