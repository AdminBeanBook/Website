import type { BrandColors } from "@/lib/site-config/types";
import { IMAGES, SITE } from "@/lib/site";

export type WrapEmailOptions = {
  colors?: BrandColors;
  logoUrl?: string;
  siteName?: string;
  tagline?: string;
};

function isBrandColors(
  value: BrandColors | WrapEmailOptions | undefined,
): value is BrandColors {
  return Boolean(
    value &&
      typeof value === "object" &&
      "green" in value &&
      "cream" in value &&
      !("colors" in value) &&
      !("logoUrl" in value),
  );
}

/**
 * Sidemark-style shell: brand-green page, centered logo, padded content card.
 * Accepts either WrapEmailOptions or a legacy BrandColors object.
 */
export function wrapEmailHtml(
  bodyHtml: string,
  options?: BrandColors | WrapEmailOptions,
): string {
  const opts: WrapEmailOptions = isBrandColors(options)
    ? { colors: options }
    : (options ?? {});

  const colors = opts.colors;
  const green = colors?.green ?? "#1e3a3a";
  const cream = colors?.cream ?? "#e5d8c1";
  const accent = colors?.accent ?? "#c47a3a";
  const textOnDark = "#ffffff";
  const siteName = opts.siteName?.trim() || SITE.name;
  const tagline = opts.tagline?.trim() || "Denver coffee passbook";
  const logoUrl = opts.logoUrl?.trim() || IMAGES.logo;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <style type="text/css">
    .bb-body p { margin: 0 0 16px; }
    .bb-body h1, .bb-body h2, .bb-body h3 {
      margin: 0 0 12px;
      font-weight: 600;
      line-height: 1.3;
      color: ${textOnDark};
    }
    .bb-body h1 { font-size: 28px; }
    .bb-body h2 { font-size: 22px; }
    .bb-body h3 { font-size: 18px; }
    .bb-body ul, .bb-body ol {
      margin: 0 0 16px;
      padding-left: 28px;
    }
    .bb-body li { margin: 0 0 8px; }
    .bb-body a { color: ${cream}; }
    .bb-body img { max-width: 100%; height: auto; }
  </style>
</head>
<body style="margin:0;padding:0;background:${green};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${green};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
        <tr>
          <td align="center" style="padding:8px 24px 28px;">
            <img src="${logoUrl}" alt="${siteName}" width="88" height="88" style="display:block;width:88px;height:88px;border:0;border-radius:50%;object-fit:contain;" />
          </td>
        </tr>
        <tr>
          <td class="bb-body" style="padding:40px 48px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:${textOnDark};border:1px solid rgba(255,255,255,0.18);border-radius:4px;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 48px 8px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${cream};opacity:0.85;">
            ${siteName} · ${tagline}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 48px 8px;">
            <div style="width:48px;height:3px;background:${accent};border-radius:2px;"></div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const EMAIL_TEMPLATE_STARTER = `<h2 style="text-align:center;">Hello Team!</h2>
<p>Write your message here. Use the toolbar for headings, lists, alignment, links, and brand colors.</p>
<ol>
  <li>First step</li>
  <li>Second step</li>
  <li>Third step</li>
</ol>
<p style="text-align:center;"><a href="https://thebeanbook.com">Your call to action</a></p>
<p>Thanks,<br>The Bean Book team</p>`;
