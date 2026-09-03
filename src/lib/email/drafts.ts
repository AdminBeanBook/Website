import type { EmailAudience } from "@/lib/email/recipients";

export type EmailDraftPayload = {
  subject: string;
  htmlBody: string;
  senderKey: string;
  audience: EmailAudience | null;
  customEmails: string;
  tagIds: string[];
};

export type EmailDraftRow = EmailDraftPayload & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export function parseTagIdsJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function serializeDraft(draft: {
  id: string;
  subject: string;
  htmlBody: string;
  senderKey: string;
  audience: string | null;
  customEmails: string;
  tagIdsJson: string;
  createdAt: Date;
  updatedAt: Date;
}): EmailDraftRow {
  const audience =
    draft.audience === "customers" ||
    draft.audience === "contacts" ||
    draft.audience === "custom"
      ? draft.audience
      : null;
  return {
    id: draft.id,
    subject: draft.subject,
    htmlBody: draft.htmlBody,
    senderKey: draft.senderKey,
    audience,
    customEmails: draft.customEmails,
    tagIds: parseTagIdsJson(draft.tagIdsJson),
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
  };
}

export function looksEmptyHtml(html: string): boolean {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim() === "";
}

export function draftHasContent(payload: EmailDraftPayload): boolean {
  return Boolean(
    payload.subject.trim() ||
      !looksEmptyHtml(payload.htmlBody) ||
      payload.audience ||
      payload.customEmails.trim(),
  );
}

export function draftSnippet(html: string, max = 90): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function draftAudienceLabel(
  audience: EmailAudience | null,
): string {
  if (audience === "customers") return "Customers";
  if (audience === "contacts") return "Contacts";
  if (audience === "custom") return "Pasted emails";
  return "No recipients yet";
}