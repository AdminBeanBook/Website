"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmailHtmlEditor } from "@/components/admin/EmailHtmlEditor";
import type { ContactTagRow } from "@/lib/contacts/types";
import type { EmailSender } from "@/lib/email/senders";
import { EMAIL_TEMPLATE_STARTER } from "@/lib/email/templates";

import type { BrandColors } from "@/lib/site-config/types";

type SavedTemplate = {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
};

type BulkEmailComposerProps = {
  initialSenders: EmailSender[];
  colors: BrandColors;
  emailConfigured: boolean;
  currentAdminEmail: string;
  initialTags: ContactTagRow[];
  initialTemplates: SavedTemplate[];
  prefillTemplate?: SavedTemplate | null;
};

type Audience = "customers" | "contacts" | "custom";

function orderFromAddresses(senders: EmailSender[]): EmailSender[] {
  const admin = senders.find((s) => s.key === "customers");
  const shops = senders.find((s) => s.key === "shops");
  return [admin, shops].filter((s): s is EmailSender => Boolean(s));
}

export function BulkEmailComposer({
  initialSenders,
  colors,
  emailConfigured,
  currentAdminEmail,
  initialTags,
  initialTemplates,
  prefillTemplate,
}: BulkEmailComposerProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fromAddresses = orderFromAddresses(initialSenders);
  const [senderKey, setSenderKey] = useState(
    fromAddresses[0]?.key ?? "customers",
  );
  const [subject, setSubject] = useState(prefillTemplate?.subject ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    prefillTemplate?.id ?? "",
  );
  const [audience, setAudience] = useState<Audience>("customers");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [editorReady, setEditorReady] = useState(false);

  const initialBody =
    prefillTemplate?.htmlBody ?? EMAIL_TEMPLATE_STARTER;

  const refreshCount = useCallback(async () => {
    const params = new URLSearchParams({
      audience,
      custom: audience === "custom" ? customEmails : "",
    });
    if (audience === "contacts" && selectedTagIds.length > 0) {
      params.set("tagIds", selectedTagIds.join(","));
    }
    const res = await fetch(`/api/admin/email/recipients?${params}`);
    if (res.ok) {
      const data = (await res.json()) as { count: number };
      setRecipientCount(data.count);
    }
  }, [audience, customEmails, selectedTagIds]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    if (editorRef.current && editorReady && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialBody;
    }
  }, [editorReady, initialBody]);

  useEffect(() => {
    setEditorReady(true);
  }, []);

  function getBodyHtml(): string {
    return editorRef.current?.innerHTML ?? "";
  }

  function loadTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const template = initialTemplates.find((t) => t.id === templateId);
    if (!template) return;
    if (template.subject) setSubject(template.subject);
    if (editorRef.current) {
      editorRef.current.innerHTML = template.htmlBody;
    }
    setMessage(`Loaded template: ${template.name}`);
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function loadPreview() {
    const res = await fetch("/api/admin/email/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ htmlBody: getBodyHtml() }),
    });
    if (res.ok) {
      const data = (await res.json()) as { html: string };
      setPreviewHtml(data.html);
    } else {
      setPreviewHtml(getBodyHtml());
    }
    setView("preview");
  }

  async function handleSend(testOnly: boolean) {
    setSending(true);
    setMessage(null);
    const res = await fetch("/api/admin/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderKey,
        subject,
        htmlBody: getBodyHtml(),
        audience,
        customEmails: audience === "custom" ? customEmails : undefined,
        tagIds: audience === "contacts" ? selectedTagIds : undefined,
        testOnly,
        testEmail: currentAdminEmail,
      }),
    });
    const data = (await res.json()) as {
      error?: string;
      errors?: string[];
      successCount?: number;
      failureCount?: number;
      dryRun?: boolean;
      recipientCount?: number;
    };
    setSending(false);

    if (!res.ok) {
      setMessage(data.error ?? "Send failed");
      return;
    }

    const prefix = data.dryRun ? "[Test mode — no RESEND_API_KEY] " : "";
    const summary = `${prefix}Sent to ${data.successCount ?? 0} of ${data.recipientCount ?? 0}${
      data.failureCount ? ` (${data.failureCount} failed)` : ""
    }`;
    const detail =
      data.errors?.length && (data.failureCount ?? 0) > 0
        ? ` — ${data.errors.join("; ")}`
        : "";
    setMessage(summary + detail);
  }

  const inputClass =
    "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-4">
        {!emailConfigured && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Add <code className="text-xs">RESEND_API_KEY</code> to{" "}
            <code className="text-xs">.env.local</code> to send real email. Until
            then, sends are logged only (dry run). Verify{" "}
            <code className="text-xs">shops@thebeanbook.org</code> and{" "}
            <code className="text-xs">Admin@thebeanbook.org</code> in Resend.
          </p>
        )}

        <div className="flex gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setView("edit")}
            className={`border-b-2 px-3 py-2 text-sm ${
              view === "edit"
                ? "border-brand-green text-brand-green"
                : "border-transparent text-gray-600"
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={loadPreview}
            className={`border-b-2 px-3 py-2 text-sm ${
              view === "preview"
                ? "border-brand-green text-brand-green"
                : "border-transparent text-gray-600"
            }`}
          >
            Preview
          </button>
        </div>

        {view === "edit" ? (
          <EmailHtmlEditor
            editorRef={editorRef}
            colors={colors}
            defaultHtml={initialBody}
          />
        ) : (
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            className="h-[400px] w-full rounded-lg border border-gray-200 bg-white"
          />
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={sending || !subject.trim()}
            onClick={() => handleSend(true)}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            Send test to me
          </button>
          <button
            type="button"
            disabled={sending || !subject.trim() || recipientCount === 0}
            onClick={() => handleSend(false)}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {sending ? "Sending…" : `Send to ${recipientCount ?? 0} recipients`}
          </button>
        </div>
        {message && (
          <p
            className={`text-sm ${
              message.includes("failed") ? "text-red-700" : "text-green-700"
            }`}
            role="status"
          >
            {message}
          </p>
        )}
      </div>

      <aside className="space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Template</h3>
          {initialTemplates.length === 0 ? (
            <p className="mt-2 text-xs text-gray-500">
              No templates yet.{" "}
              <Link
                href="/admin/email/templates"
                className="text-brand-green hover:underline"
              >
                Create one
              </Link>
              .
            </p>
          ) : (
            <select
              value={selectedTemplateId}
              onChange={(e) => loadTemplate(e.target.value)}
              className={`${inputClass} mt-2`}
            >
              <option value="">Start from scratch</option>
              {initialTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <Link
            href="/admin/email/templates"
            className="mt-2 block text-xs text-brand-green hover:underline"
          >
            Manage templates →
          </Link>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">From address</h3>
          <select
            value={senderKey}
            onChange={(e) => setSenderKey(e.target.value)}
            className={`${inputClass} mt-2`}
          >
            {fromAddresses.map((s) => (
              <option key={s.key} value={s.key}>
                {s.fromEmail}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Recipients</h3>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as Audience)}
            className={`${inputClass} mt-2`}
          >
            <option value="customers">All customers</option>
            <option value="contacts">Tagged contacts</option>
            <option value="custom">Custom list</option>
          </select>
          <p className="mt-2 text-xs text-gray-500">
            {recipientCount ?? "…"} recipients selected
          </p>
          {audience === "contacts" && (
            <div className="mt-2 space-y-2">
              {initialTags.length === 0 ? (
                <p className="text-xs text-amber-800">
                  No tags yet.{" "}
                  <Link
                    href="/admin/settings/contacts/tags"
                    className="underline"
                  >
                    Create tags
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/admin/settings/contacts"
                    className="underline"
                  >
                    add contacts
                  </Link>
                  .
                </p>
              ) : (
                <>
                  <p className="text-xs text-gray-500">
                    Leave all unchecked to email every active contact with an
                    email. Check one or more to narrow the list.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {initialTags.map((tag) => (
                      <label
                        key={tag.id}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                        />
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {audience === "custom" && (
            <textarea
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              rows={4}
              placeholder="One email per line"
              className={`${inputClass} mt-2 font-mono text-xs`}
            />
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Subject</h3>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`${inputClass} mt-2`}
            placeholder="Email subject"
          />
        </section>

        <p className="text-xs text-gray-500">
          Manage people in{" "}
          <Link
            href="/admin/settings/contacts"
            className="text-brand-green hover:underline"
          >
            Settings → Contacts
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
