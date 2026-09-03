"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmailHtmlEditor } from "@/components/admin/EmailHtmlEditor";
import type { ContactTagRow } from "@/lib/contacts/types";
import {
  draftHasContent,
  type EmailDraftRow,
} from "@/lib/email/drafts";
import type { EmailSender } from "@/lib/email/senders";
import { EMAIL_TEMPLATE_STARTER } from "@/lib/email/templates";

import type { BrandColors } from "@/lib/site-config/types";

type SavedTemplate = {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
};

type RecipientPreview = { email: string; label?: string };

type BulkEmailComposerProps = {
  initialSenders: EmailSender[];
  colors: BrandColors;
  emailConfigured: boolean;
  currentAdminEmail: string;
  initialTags: ContactTagRow[];
  initialTemplates: SavedTemplate[];
  prefillTemplate?: SavedTemplate | null;
  initialDraft?: EmailDraftRow | null;
};

type Audience = "customers" | "contacts" | "custom";

const AUDIENCE_OPTIONS: { value: Audience; label: string; hint: string }[] = [
  {
    value: "contacts",
    label: "Contacts",
    hint: "People in Contacts, optionally filtered by tag",
  },
  {
    value: "customers",
    label: "Customers",
    hint: "Everyone who has ordered",
  },
  {
    value: "custom",
    label: "Paste emails",
    hint: "A list you type or paste",
  },
];

function orderedSenders(senders: EmailSender[]): EmailSender[] {
  const admin = senders.find((s) => s.key === "customers");
  const shops = senders.find((s) => s.key === "shops");
  const rest = senders.filter(
    (s) => s.key !== "customers" && s.key !== "shops",
  );
  return [admin, shops, ...rest].filter((s): s is EmailSender => Boolean(s));
}

function looksEmpty(html: string): boolean {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim() === "";
}

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 5;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function BulkEmailComposer({
  initialSenders,
  colors,
  emailConfigured,
  currentAdminEmail,
  initialTags,
  initialTemplates,
  prefillTemplate,
  initialDraft,
}: BulkEmailComposerProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fromAddresses = orderedSenders(initialSenders);
  const [senderKey, setSenderKey] = useState(() => {
    if (
      initialDraft?.senderKey &&
      fromAddresses.some((s) => s.key === initialDraft.senderKey)
    ) {
      return initialDraft.senderKey;
    }
    return fromAddresses[0]?.key ?? "customers";
  });
  const [subject, setSubject] = useState(
    initialDraft?.subject ?? prefillTemplate?.subject ?? "",
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialDraft ? "" : (prefillTemplate?.id ?? ""),
  );
  const [audience, setAudience] = useState<Audience | null>(
    initialDraft?.audience ?? null,
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialDraft?.tagIds ?? [],
  );
  const [customEmails, setCustomEmails] = useState(
    initialDraft?.customEmails ?? "",
  );
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview[]>(
    [],
  );
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftHtml, setDraftHtml] = useState(
    initialDraft?.htmlBody ??
      prefillTemplate?.htmlBody ??
      EMAIL_TEMPLATE_STARTER,
  );
  const [draftId, setDraftId] = useState<string | null>(
    initialDraft?.id ?? null,
  );
  const [draftStatus, setDraftStatus] = useState<string | null>(
    initialDraft ? "Draft loaded" : null,
  );
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [templates, setTemplates] = useState(initialTemplates);
  const [editorKey, setEditorKey] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipPersistRef = useRef(false);
  const mountedRef = useRef(true);
  const draftIdRef = useRef<string | null>(initialDraft?.id ?? null);
  const senderKeyRef = useRef(senderKey);
  const subjectRef = useRef(subject);
  const audienceRef = useRef(audience);
  const customEmailsRef = useRef(customEmails);
  const tagIdsRef = useRef(selectedTagIds);
  const draftHtmlRef = useRef(draftHtml);
  const persistDraftRef = useRef<
    (opts?: { keepalive?: boolean; silent?: boolean }) => Promise<boolean>
  >(async () => false);

  senderKeyRef.current = senderKey;
  subjectRef.current = subject;
  audienceRef.current = audience;
  customEmailsRef.current = customEmails;
  tagIdsRef.current = selectedTagIds;
  draftHtmlRef.current = draftHtml;

  const selectedSender =
    fromAddresses.find((s) => s.key === senderKey) ?? fromAddresses[0];

  const getBodyHtml = useCallback(() => {
    return editorRef.current?.innerHTML || draftHtml;
  }, [draftHtml]);

  const refreshCount = useCallback(async () => {
    if (!audience) {
      setRecipientCount(null);
      setRecipientPreview([]);
      return;
    }
    const params = new URLSearchParams({
      audience,
      custom: audience === "custom" ? customEmails : "",
    });
    if (audience === "contacts" && selectedTagIds.length > 0) {
      params.set("tagIds", selectedTagIds.join(","));
    }
    const res = await fetch(`/api/admin/email/recipients?${params}`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      count: number;
      preview?: RecipientPreview[];
    };
    setRecipientCount(data.count);
    setRecipientPreview(data.preview ?? []);
  }, [audience, customEmails, selectedTagIds]);

  useEffect(() => {
    const delay = audience === "custom" ? 400 : 0;
    const timer = window.setTimeout(() => {
      void refreshCount();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [audience, customEmails, refreshCount]);

  function snapshotDraft() {
    return {
      subject: subjectRef.current,
      htmlBody: editorRef.current?.innerHTML || draftHtmlRef.current,
      senderKey: senderKeyRef.current,
      audience: audienceRef.current,
      customEmails: customEmailsRef.current,
      tagIds: tagIdsRef.current,
    };
  }

  function putDraftUrlInHistory(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("draft", id);
    url.searchParams.delete("template");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  async function persistDraft(opts?: {
    keepalive?: boolean;
    silent?: boolean;
  }): Promise<boolean> {
    if (skipPersistRef.current) return false;
    const payload = snapshotDraft();
    if (!draftHasContent(payload)) return false;
    const id = draftIdRef.current ?? crypto.randomUUID();
    draftIdRef.current = id;
    if (mountedRef.current) {
      setDraftId(id);
      putDraftUrlInHistory(id);
      if (!opts?.silent && !opts?.keepalive) {
        setDraftStatus("Saving…");
      }
    }
    try {
      const res = await fetch(`/api/admin/email/drafts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: opts?.keepalive,
      });
      if (!res.ok) {
        if (mountedRef.current && !opts?.keepalive) {
          setDraftStatus("Could not save draft");
        }
        return false;
      }
      if (mountedRef.current) {
        setDraftStatus("Draft saved");
      }
      return true;
    } catch {
      if (mountedRef.current && !opts?.keepalive) {
        setDraftStatus("Could not save draft");
      }
      return false;
    }
  }

  persistDraftRef.current = persistDraft;

  useEffect(() => {
    mountedRef.current = true;
    function saveOnLeave() {
      void persistDraftRef.current?.({ keepalive: true, silent: true });
    }
    window.addEventListener("pagehide", saveOnLeave);
    window.addEventListener("beforeunload", saveOnLeave);
    return () => {
      window.removeEventListener("pagehide", saveOnLeave);
      window.removeEventListener("beforeunload", saveOnLeave);
      mountedRef.current = false;
      void persistDraftRef.current?.({ silent: true });
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void persistDraft({ silent: true });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [subject, draftHtml, senderKey, audience, customEmails, selectedTagIds]);

  async function handleSaveDraft() {
    setError(null);
    const payload = snapshotDraft();
    if (!draftHasContent(payload)) {
      setError("Write something before saving a draft.");
      return;
    }
    const ok = await persistDraft();
    if (ok) {
      setMessage("Draft saved. Find it under Drafts if you leave this page.");
    } else {
      setError("Could not save draft.");
    }
  }

  function setEditorHtml(html: string) {
    setDraftHtml(html);
    setEditorKey((key) => key + 1);
  }

  function loadTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    setMessage(null);
    setError(null);
    if (!templateId) {
      setSubject("");
      setEditorHtml(EMAIL_TEMPLATE_STARTER);
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setSubject(template.subject);
    setEditorHtml(template.htmlBody || EMAIL_TEMPLATE_STARTER);
    setMessage(`Loaded “${template.name}”`);
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function loadPreview() {
    const htmlBody = getBodyHtml();
    const res = await fetch("/api/admin/email/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ htmlBody }),
    });
    if (res.ok) {
      const data = (await res.json()) as { html: string };
      setPreviewHtml(data.html);
    } else {
      setPreviewHtml(htmlBody);
    }
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    setFiles((current) => {
      const next = [...current];
      for (const file of list) {
        if (next.length >= MAX_FILES) {
          setError(`You can attach up to ${MAX_FILES} files`);
          break;
        }
        if (file.size > MAX_FILE_BYTES) {
          setError(`${file.name} is over 8 MB`);
          continue;
        }
        if (next.some((f) => f.name === file.name && f.size === file.size)) {
          continue;
        }
        next.push(file);
      }
      return next;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend(testOnly: boolean) {
    if (!testOnly && !audience) {
      setError("Choose who this goes to.");
      setConfirmSend(false);
      return;
    }
    if (!testOnly && looksEmpty(getBodyHtml())) {
      setError("Write a message before sending.");
      setConfirmSend(false);
      return;
    }
    setSending(true);
    setMessage(null);
    setError(null);
    setConfirmSend(false);
    let attachments:
      | { filename: string; content: string; type: string }[]
      | undefined;
    try {
      if (files.length > 0) {
        attachments = await Promise.all(
          files.map(async (file) => ({
            filename: file.name,
            content: await readFileAsBase64(file),
            type: file.type || "application/octet-stream",
          })),
        );
      }
    } catch {
      setSending(false);
      setError("Could not read an attached file");
      return;
    }
    const res = await fetch("/api/admin/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderKey,
        subject,
        htmlBody: getBodyHtml(),
        audience: audience ?? "custom",
        customEmails: audience === "custom" ? customEmails : undefined,
        tagIds: audience === "contacts" ? selectedTagIds : undefined,
        testOnly,
        testEmail: currentAdminEmail,
        attachments,
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
      setError(data.error ?? "Send failed");
      return;
    }

    const prefix = data.dryRun ? "Not actually delivered (missing Resend key). " : "";
    if (testOnly) {
      setMessage(
        `${prefix}Test sent to ${currentAdminEmail}. Check that inbox before sending to everyone.`,
      );
      return;
    }
    const failed = data.failureCount ?? 0;
    const summary = `${prefix}Sent to ${data.successCount ?? 0} of ${data.recipientCount ?? 0}`;
    if (failed > 0) {
      setError(
        `${summary} (${failed} failed)${
          data.errors?.length ? ` — ${data.errors.join("; ")}` : ""
        }`,
      );
      return;
    }
    setMessage(summary);
    skipPersistRef.current = true;
    const id = draftIdRef.current;
    if (id) {
      void fetch(`/api/admin/email/drafts/${id}`, { method: "DELETE" });
    }
    draftIdRef.current = null;
    setDraftId(null);
    setDraftStatus(null);
    window.history.replaceState(null, "", "/admin/email");
  }

  async function saveTemplate() {
    const name = saveName.trim();
    if (!name) return;
    const res = await fetch("/api/admin/email/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        subject,
        htmlBody: getBodyHtml(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save template");
      return;
    }
    setTemplates((list) => [
      ...list,
      {
        id: data.id,
        name: data.name,
        subject: data.subject,
        htmlBody: data.htmlBody,
      },
    ]);
    setSelectedTemplateId(data.id);
    setSaveName("");
    setSaveOpen(false);
    setMessage(`Saved template “${data.name}”`);
  }

  const canSend =
    Boolean(audience) &&
    Boolean(subject.trim()) &&
    (recipientCount ?? 0) > 0 &&
    !sending;
  const audienceLabel =
    AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? "recipients";
  const inputClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {!emailConfigured && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Email sending is not connected yet. Messages will be logged only until
          Resend is set up.
        </p>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">
            {draftId ? "Draft" : "New email"}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {templates.length > 0 && (
              <select
                value={selectedTemplateId}
                onChange={(e) => loadTemplate(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">Blank email</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => {
                setSaveOpen((open) => !open);
                setSaveName(
                  templates.find((t) => t.id === selectedTemplateId)?.name ?? "",
                );
              }}
              className="text-sm text-brand-green hover:underline"
            >
              Save as template
            </button>
          </div>
        </div>

        {saveOpen && (
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Template name"
              className="min-w-[12rem] flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => void saveTemplate()}
              disabled={!saveName.trim()}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setSaveOpen(false)}
              className="text-sm text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          <label className="grid gap-1 px-4 py-3 sm:grid-cols-[5rem_1fr] sm:items-center">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              From
            </span>
            <select
              value={senderKey}
              onChange={(e) => setSenderKey(e.target.value)}
              className={inputClass}
            >
              {fromAddresses.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.fromName} · {s.fromEmail}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2 px-4 py-3 sm:grid-cols-[5rem_1fr] sm:items-start">
            <span className="pt-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              To
            </span>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAudience(option.value)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      audience === option.value
                        ? "border-brand-green bg-brand-green/10 font-medium text-brand-green"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {!audience ? (
                <p className="text-sm text-gray-500">Choose who this goes to.</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500">
                    {AUDIENCE_OPTIONS.find((o) => o.value === audience)?.hint}
                  </p>

                  {audience === "contacts" && (
                    <div>
                      {initialTags.length === 0 ? (
                        <p className="text-sm text-gray-600">
                          No tags yet — this will go to every contact with an email.{" "}
                          <Link
                            href="/admin/settings/contacts/tags"
                            className="text-brand-green hover:underline"
                          >
                            Add tags
                          </Link>
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {initialTags.map((tag) => {
                            const on = selectedTagIds.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                                  on
                                    ? "border-gray-900 bg-gray-900 text-white"
                                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {selectedTagIds.length === 0 && initialTags.length > 0 ? (
                        <p className="mt-2 text-xs text-gray-500">
                          No tags selected — sending to all contacts with an email.
                        </p>
                      ) : null}
                    </div>
                  )}

                  {audience === "custom" && (
                    <textarea
                      value={customEmails}
                      onChange={(e) => setCustomEmails(e.target.value)}
                      rows={3}
                      placeholder="one@email.com, another@email.com"
                      className={`${inputClass} font-mono text-xs`}
                    />
                  )}

                  <p className="text-sm text-gray-700">
                    {recipientCount === null
                      ? "Counting…"
                      : recipientCount === 0
                        ? "No one selected yet."
                        : `${recipientCount} ${
                            recipientCount === 1 ? "person" : "people"
                          }`}
                    {recipientPreview.length > 0 ? (
                      <span className="text-gray-500">
                        {" "}
                        ·{" "}
                        {recipientPreview
                          .map((r) => r.label || r.email)
                          .join(", ")}
                        {recipientCount &&
                        recipientCount > recipientPreview.length
                          ? `, +${recipientCount - recipientPreview.length} more`
                          : ""}
                      </span>
                    ) : null}
                  </p>
                </>
              )}
            </div>
          </div>

          <label className="grid gap-1 px-4 py-3 sm:grid-cols-[5rem_1fr] sm:items-center">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Subject
            </span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
              placeholder="What’s this email about?"
            />
          </label>
        </div>

          <div className="grid gap-2 border-t border-gray-100 px-4 py-4 sm:grid-cols-[5rem_1fr] sm:items-start">
            <span className="pt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              Message
            </span>
            <EmailHtmlEditor
              key={editorKey}
              editorRef={editorRef}
              colors={colors}
              defaultHtml={draftHtml}
              onChange={setDraftHtml}
              placeholder="Write the email here…"
              minHeightClass="min-h-[320px]"
              extraToolbar={
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                  <button
                    type="button"
                    title="Attach files"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded px-2 py-1 text-xs text-gray-800 hover:bg-white"
                  >
                    Attach
                  </button>
                </>
              }
            />
            {files.length > 0 && (
              <>
              <ul className="mt-3 space-y-1">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
                  >
                    <span className="truncate">
                      {file.name}
                      <span className="text-gray-500">
                        {" "}
                        · {formatFileSize(file.size)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((list) => list.filter((_, i) => i !== index))
                      }
                      className="shrink-0 text-xs text-gray-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-gray-500">
                Attached files are not stored in drafts. Re-attach them before
                you send.
              </p>
              </>
            )}
          </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void loadPreview()}
              className="text-sm text-gray-700 hover:underline"
            >
              Preview
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => void handleSaveDraft()}
              className="text-sm text-gray-700 hover:underline disabled:opacity-50"
            >
              Save as draft
            </button>
            {draftStatus ? (
              <span className="text-xs text-gray-500">{draftStatus}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={sending || !subject.trim()}
              onClick={() => void handleSend(true)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Send test to me
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={() => setConfirmSend(true)}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Send
              {recipientCount ? ` to ${recipientCount}` : ""}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-green-800" role="status">
          {message}
        </p>
      )}

      {previewHtml !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPreviewHtml(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Preview</p>
                <p className="text-xs text-gray-500">
                  {selectedSender?.fromEmail} · {subject || "(no subject)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewHtml(null)}
                className="text-sm text-gray-600 hover:underline"
              >
                Close
              </button>
            </div>
            <iframe
              title="Email preview"
              srcDoc={previewHtml}
              className="min-h-[24rem] w-full flex-1 bg-gray-100"
            />
          </div>
        </div>
      )}

      {confirmSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Send this email?</h3>
            <p className="mt-2 text-sm text-gray-600">
              It will go to <strong>{recipientCount}</strong> {audienceLabel.toLowerCase()}{" "}
              from <strong>{selectedSender?.fromEmail}</strong>.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Subject: <strong>{subject}</strong>
            </p>
            {files.length > 0 ? (
              <p className="mt-2 text-sm text-gray-600">
                Attachments: {files.map((f) => f.name).join(", ")}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmSend(false)}
                className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => void handleSend(false)}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                {sending ? "Sending…" : "Send now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}