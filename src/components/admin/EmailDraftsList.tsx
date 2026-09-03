"use client";

import Link from "next/link";
import { useState } from "react";
import {
  draftAudienceLabel,
  draftSnippet,
  type EmailDraftRow,
} from "@/lib/email/drafts";

export function EmailDraftsList({
  initialDrafts,
}: {
  initialDrafts: EmailDraftRow[];
}) {
  const [drafts, setDrafts] = useState(initialDrafts);

  async function removeDraft(draft: EmailDraftRow) {
    const label = draft.subject.trim() || "this draft";
    if (!confirm(`Delete “${label}”?`)) return;
    const res = await fetch(`/api/admin/email/drafts/${draft.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setDrafts((list) => list.filter((item) => item.id !== draft.id));
  }

  if (drafts.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No drafts yet. On Compose, use Save as draft — or just leave the page.
        Unfinished emails are saved automatically.
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Drafts ({drafts.length})
      </h2>
      <ul className="mt-4 divide-y divide-gray-100">
        {drafts.map((draft) => (
          <li
            key={draft.id}
            className="flex flex-wrap items-start justify-between gap-3 py-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">
                {draft.subject.trim() || "(no subject)"}
              </p>
              <p className="mt-0.5 text-sm text-gray-600">
                {draftAudienceLabel(draft.audience)}
              </p>
              {draftSnippet(draft.htmlBody) ? (
                <p className="mt-1 truncate text-sm text-gray-500">
                  {draftSnippet(draft.htmlBody)}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-gray-400">
                Saved {new Date(draft.updatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link
                href={`/admin/email?draft=${draft.id}`}
                className="font-medium text-brand-green hover:underline"
              >
                Continue
              </Link>
              <button
                type="button"
                onClick={() => void removeDraft(draft)}
                className="text-gray-600 hover:text-red-700 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
