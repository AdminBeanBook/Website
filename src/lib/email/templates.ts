import type { BrandColors } from "@/lib/site-config/types";

export function wrapEmailHtml(bodyHtml: string, colors?: BrandColors): string {
  const green = colors?.green ?? "#1e3a3a";
  const cream = colors?.cream ?? "#e5d8c1";
  const accent = colors?.accent ?? "#c47a3a";
  const text = colors?.text ?? "#2D3E40";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:${cream};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${cream};padding:24px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:${green};padding:20px 24px;">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;color:#ffffff;">The Bean Book</p>
        </td></tr>
        <tr><td style="padding:28px 24px;font-family:system-ui,sans-serif;font-size:16px;line-height:1.6;color:${text};">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;background:${cream};border-top:3px solid ${accent};">
          <p style="margin:0;font-family:system-ui,sans-serif;font-size:12px;color:${text};opacity:0.8;">
            The Bean Book · Denver coffee passbook
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const EMAIL_TEMPLATE_STARTER = `<p>Hi there,</p>
<p>Write your message here. Use the color buttons to highlight text in your brand colors.</p>
<p>Thanks,<br>The Bean Book team</p>`;
