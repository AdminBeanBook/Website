"use client";

import { useState } from "react";
import type { EmailSender } from "@/lib/email/senders";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  read: boolean;
  createdAt: string;
};

type MessageDetailProps = {
  message: Message;
  senders: EmailSender[];
  emailConfigured: boolean;
};

export function MessageDetail({
  message,
  senders,
  emailConfigured,
}: MessageDetailProps) {
  const defaultSender =
    senders.find((s) => s.key === "customers")?.key ?? senders[0]?.key ?? "";

  const [senderKey, setSenderKey] = useState(defaultSender);
  const [subject, setSubject] = useState("Re: Your message to The Bean Book");
  const [bodyText, setBodyText] = useState(
    `Hi ${message.name.split(" ")[0] || "there"},\n\nThank you for reaching out to The Bean Book.\n\n\nBest,\nThe Bean Book team`,
  );
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    setError(null);

    try {
      const res = await fetch(`/api/admin/contact/${message.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderKey, subject, bodyText }),
      });
      const data = (await res.json()) as { error?: string; dryRun?: boolean };
      if (!res.ok) {
        throw new Error(data.error ?? "Send failed");
      }
      setStatus(
        data.dryRun
          ? "Dry run — email logged (add RESEND_API_KEY to send for real)."
          : `Email sent to ${message.email}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{message.name}</h2>
            <p className="text-sm text-gray-600">
              <a
                href={`mailto:${message.email}`}
                className="text-brand-green hover:underline"
              >
                {message.email}
              </a>
              {message.phone ? ` · ${message.phone}` : ""}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {new Date(message.createdAt).toLocaleString()}
            </p>
          </div>
          {!message.read && (
            <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-medium text-brand-green">
              Unread
            </span>
          )}
        </div>
        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
          {message.message}
        </p>
      </article>

      <div className="space-y-4">
        {!emailConfigured && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Add <code>RESEND_API_KEY</code> to send real email. Until then,
            replies are dry-run only.
          </p>
        )}

        <form
          onSubmit={handleSend}
          className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Reply by email
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Send from
            </label>
            <select
              value={senderKey}
              onChange={(e) => setSenderKey(e.target.value)}
              className={inputClass}
            >
              {senders.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label} ({s.fromEmail})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              To
            </label>
            <input
              value={`${message.name} <${message.email}>`}
              readOnly
              className={`${inputClass} bg-white text-gray-600`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Message
            </label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={10}
              className={`${inputClass} leading-relaxed`}
            />
            <p className="mt-1 text-[10px] text-gray-400">
              Their original message is quoted at the bottom of the email
              automatically.
            </p>
          </div>

          <button
            type="submit"
            disabled={sending || !senderKey}
            className="w-full rounded bg-brand-green px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send reply"}
          </button>

          {status && (
            <p className="text-xs text-green-700" role="status">
              {status}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
        </form>

        <a
          href={`mailto:${message.email}?subject=${encodeURIComponent(subject)}`}
          className="block text-center text-xs text-gray-500 hover:text-brand-green hover:underline"
        >
          Or open in your mail app
        </a>
      </div>
    </div>
  );
}
