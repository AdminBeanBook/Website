import { Resend } from "resend";
import { getSiteConfig } from "@/lib/site-config";
import { getEmailSenders, getSenderByKey } from "@/lib/email/senders";
import { wrapEmailHtml } from "@/lib/email/templates";

export type SendContactReplyInput = {
  senderKey: string;
  toEmail: string;
  toName: string;
  subject: string;
  bodyText: string;
  originalMessage: string;
  originalDate: Date;
};

export type SendContactReplyResult = {
  dryRun: boolean;
};

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(text: string): string {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return "<p></p>";
  return paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 1em;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

function quotedOriginalHtml(message: string, date: Date): string {
  const when = date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Their message on ${escapeHtml(when)}:</p>
<blockquote style="margin:0;padding:12px 16px;border-left:3px solid #d1d5db;background:#f9fafb;font-size:14px;color:#374151;white-space:pre-wrap;">${escapeHtml(message)}</blockquote>`;
}

export async function sendContactReply(
  input: SendContactReplyInput,
): Promise<SendContactReplyResult> {
  const senders = await getEmailSenders();
  const sender = getSenderByKey(senders, input.senderKey);
  if (!sender) {
    throw new Error("Invalid sender");
  }

  const to = input.toEmail.trim();
  if (!to.includes("@")) {
    throw new Error("Invalid recipient email");
  }

  const site = await getSiteConfig("published");
  const bodyHtml =
    textToHtml(input.bodyText) +
    quotedOriginalHtml(input.originalMessage, input.originalDate);
  const html = wrapEmailHtml(bodyHtml, {
    colors: site.colors,
    logoUrl: site.images.logo,
    siteName: site.site.name,
  });

  const resend = getResend();
  if (!resend) {
    console.log("[contact reply dry-run]", {
      from: `${sender.fromName} <${sender.fromEmail}>`,
      to,
      subject: input.subject,
    });
    return { dryRun: true };
  }

  const { error } = await resend.emails.send({
    from: `${sender.fromName} <${sender.fromEmail}>`,
    to,
    replyTo: sender.fromEmail,
    subject: input.subject.trim(),
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { dryRun: false };
}
