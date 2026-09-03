"use client";

import { useState } from "react";
import { ImageField } from "@/components/admin/website-editor/ImageField";
import type { EmailBranding } from "@/lib/site-config/types";

type Props = {
  initial: EmailBranding;
  siteName: string;
};

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm";

export function EmailBrandingEditor({ initial, siteName }: Props) {
  const [branding, setBranding] = useState<EmailBranding>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  function update<K extends keyof EmailBranding>(
    key: K,
    value: EmailBranding[K],
  ) {
    setBranding((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailBranding: branding }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Failed to save");
        return;
      }
      setMessage("Branding saved — all future emails will use these settings.");
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    const res = await fetch("/api/admin/email/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        htmlBody:
          "<p>This is a preview of how your emails will look with the current branding settings.</p><p>The logo, colors, tagline, and signature shown here will appear on every email you send.</p>",
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { html: string };
      setPreviewHtml(data.html);
    }
  }

  async function handleSaveAndPreview() {
    await handleSave();
    await handlePreview();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Email branding
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          These settings control the wrapper around every email — the logo at
          the top, the colors, the tagline, and the sign-off. Change them once
          and all future emails use the new look.
        </p>

        <div className="mt-5 space-y-5">
          {/* Logo */}
          <ImageField
            label="Email logo"
            value={branding.logoUrl}
            onChange={(url) => update("logoUrl", url)}
          />

          {/* Colors */}
          <div className="grid gap-4 sm:grid-cols-3">
            <ColorField
              label="Header background"
              hint="The strip behind the logo"
              value={branding.headerColor}
              onChange={(v) => update("headerColor", v)}
            />
            <ColorField
              label="Page background"
              hint="Outer background + footer area"
              value={branding.backgroundColor}
              onChange={(v) => update("backgroundColor", v)}
            />
            <ColorField
              label="Accent"
              hint="Border between body and footer"
              value={branding.accentColor}
              onChange={(v) => update("accentColor", v)}
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Footer tagline
            </label>
            <p className="mb-1.5 text-xs text-gray-400">
              Shown in the footer as &ldquo;{siteName} · <em>your tagline</em>
              &rdquo;. Leave blank to show only the site name.
            </p>
            <input
              value={branding.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="Denver coffee passbook"
              className={inputClass}
            />
          </div>

          {/* Signature */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Signature
            </label>
            <p className="mb-1.5 text-xs text-gray-400">
              A sign-off line that appears at the bottom of the email body,
              above the footer. E.g. &ldquo;— The Bean Book Team&rdquo;
            </p>
            <input
              value={branding.signature}
              onChange={(e) => update("signature", e.target.value)}
              placeholder="— The Bean Book Team"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save branding"}
          </button>
          <button
            type="button"
            onClick={handleSaveAndPreview}
            disabled={saving}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Save & preview
          </button>
        </div>

        {message && (
          <p
            className={`mt-3 text-sm ${
              message.includes("Failed") ? "text-red-700" : "text-green-700"
            }`}
            role="status"
          >
            {message}
          </p>
        )}
      </section>

      {previewHtml && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
            <button
              type="button"
              onClick={() => setPreviewHtml(null)}
              className="text-xs text-gray-500 hover:underline"
            >
              Close
            </button>
          </div>
          <iframe
            title="Email branding preview"
            srcDoc={previewHtml}
            className="mt-3 h-[420px] w-full rounded-lg border border-gray-200 bg-white"
          />
        </section>
      )}
    </div>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <p className="mb-1.5 text-xs text-gray-400">{hint}</p>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-gray-300"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
        />
      </div>
    </div>
  );
}
