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

function bodyTextColor(colors?: BrandColors): string {
  if (colors?.text && typeof colors.text === "object" && colors.text.body) {
    return colors.text.body;
  }
  return "#2D3E40";
}

function linkColor(colors?: BrandColors): string {
  if (colors?.text && typeof colors.text === "object" && colors.text.link) {
    return colors.text.link;
  }
  return colors?.accent ?? "#c47a3a";
}

/**
 * Branded email shell that survives Apple Mail / Gmail dark-mode rewriting.
 * Light page + white card + dark text is far more reliable than a full dark body.
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
  const text = bodyTextColor(colors);
  const link = linkColor(colors);
  const siteName = opts.siteName?.trim() || SITE.name;
  const tagline = opts.tagline?.trim() || "Denver coffee passbook";
  const logoUrl = opts.logoUrl?.trim() || IMAGES.logo;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style type="text/css">
    :root { color-scheme: light only; }
    body, table, td, a { -webkit-text-size-adjust: 100%; }
    .bb-body p { margin: 0 0 16px; }
    .bb-body h1, .bb-body h2, .bb-body h3 {
      margin: 0 0 12px;
      font-weight: 600;
      line-height: 1.3;
      color: ${text} !important;
    }
    .bb-body h1 { font-size: 28px; }
    .bb-body h2 { font-size: 22px; }
    .bb-body h3 { font-size: 18px; }
    .bb-body ul, .bb-body ol {
      margin: 0 0 16px;
      padding-left: 28px;
    }
    .bb-body li { margin: 0 0 8px; }
    .bb-body a { color: ${link} !important; }
    .bb-body img { max-width: 100%; height: auto; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${cream};">
  <!-- Preheader spacer -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&nbsp;</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" bgcolor="${cream}" style="background-color:${cream};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" bgcolor="#ffffff" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td align="center" bgcolor="${green}" style="background-color:${green};padding:28px 24px;">
            <img src="${logoUrl}" alt="${siteName}" width="72" height="72" style="display:block;width:72px;height:72px;border:0;border-radius:50%;object-fit:contain;" />
          </td>
        </tr>
        <tr>
          <td class="bb-body" bgcolor="#ffffff" style="padding:40px 48px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:${text};background-color:#ffffff;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td align="center" bgcolor="${cream}" style="padding:20px 48px;background-color:${cream};border-top:3px solid ${accent};font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${text};">
            ${siteName} · ${tagline}
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
