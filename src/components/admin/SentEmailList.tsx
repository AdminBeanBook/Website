"use client";

import { useState } from "react";
import type { SentEmailBatchRow } from "@/lib/email/sent";
import { audienceLabel } from "@/lib/email/sent";

export function SentEmailList({
  initialBatches,
}: {
  initialBatches: SentEmailBatchRow[];
}) {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);

  async function previewBatch(batch: SentEmailBatchRow) {
    const res = await fetch("/api/admin/email/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ htmlBody: batch.htmlBody }),
    });
    if (res.ok) {
      const data = (await res.json()) as { html: string };
      setPreviewHtml(data.html);
    } else {
      setPreviewHtml(batch.htmlBody);
    }
    setPreviewSubject(batch.subject);
  }

  if (initialBatches.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No emails sent yet. Campaigns you send from Compose will show up here,
        including who they went to.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {previewHtml && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">
              {previewSubject ? `Preview: ${previewSubject}` : "Preview"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setPreviewHtml(null);
                setPreviewSubject(null);
              }}
              className="text-xs text-gray-500 hover:underline"
            >
              Close
            </button>
          </div>
          <iframe
            title="Sent email preview"
            srcDoc={previewHtml}
            className="mt-3 h-[360px] w-full rounded-lg border border-gray-200 bg-white"
          />
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Sent emails ({initialBatches.length})
        </h2>
        <ul className="mt-4 divide-y divide-gray-100">
          {initialBatches.map((batch) => (
            <SentEmailRow
              key={batch.id}
              batch={batch}
              onPreview={previewBatch}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function SentEmailRow({
  batch,
  onPreview,
}: {
  batch: SentEmailBatchRow;
  onPreview: (batch: SentEmailBatchRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const from = batch.fromEmail.trim() || "From address not recorded";
  const missingRecipients =
    batch.recipients.length === 0 && batch.recipientCount > 0;

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-gray-900">{batch.subject}</p>
          <p className="mt-0.5 text-sm text-gray-600">
            {batch.fromName ? `${batch.fromName} · ` : ""}
            {from}
            {" · "}
            {audienceLabel(batch.audience)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {new Date(batch.createdAt).toLocaleString()}
            {" · "}
            Sent by {batch.sentByEmail}
            {batch.dryRun ? " · Not delivered (no Resend key)" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-gray-600">
            {batch.successCount} of {batch.recipientCount} sent
            {batch.failureCount > 0 ? ` · ${batch.failureCount} failed` : ""}
          </span>
          <button
            type="button"
            onClick={() => onPreview(batch)}
            className="text-gray-600 hover:underline"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-brand-green hover:underline"
            aria-expanded={open}
          >
            {open ? "Hide recipients" : "Show recipients"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          {missingRecipients ? (
            <p className="text-xs text-gray-500">
              Recipient addresses were not saved for this send (
              {batch.recipientCount} people). New sends will keep a full list.
            </p>
          ) : batch.recipients.length === 0 ? (
            <p className="text-xs text-gray-500">No recipients recorded.</p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
              {batch.recipients.map((recipient) => (
                <li
                  key={recipient.id}
                  className="flex flex-wrap items-baseline justify-between gap-2"
                >
                  <span>
                    {recipient.name ? (
                      <>
                        <span className="text-gray-900">{recipient.name}</span>
                        <span className="text-gray-500">
                          {" "}
                          · {recipient.email}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-900">{recipient.email}</span>
                    )}
                  </span>
                  <span
                    className={
                      recipient.status === "failed"
                        ? "text-xs text-red-700"
                        : "text-xs text-gray-400"
                    }
                  >
                    {recipient.status === "failed"
                      ? recipient.error || "Failed"
                      : "Sent"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
