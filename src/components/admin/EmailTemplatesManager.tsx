"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmailHtmlEditor } from "@/components/admin/EmailHtmlEditor";
import type { EmailTemplateRow } from "@/lib/email/template-types";
import { EMAIL_TEMPLATE_STARTER } from "@/lib/email/templates";

import type { BrandColors } from "@/lib/site-config/types";

type EmailTemplatesManagerProps = {
  initialTemplates: EmailTemplateRow[];
  colors: BrandColors;
};

const inputClass =
  "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

export function EmailTemplatesManager({
  initialTemplates,
  colors,
}: EmailTemplatesManagerProps) {
  const router = useRouter();
  const createEditorRef = useRef<HTMLDivElement>(null);
  const [templates, setTemplates] = useState(initialTemplates);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  function getCreateBody(): string {
    return createEditorRef.current?.innerHTML ?? "";
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/admin/email/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        subject,
        htmlBody: getCreateBody() || EMAIL_TEMPLATE_STARTER,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to create template");
      return;
    }

    setTemplates((list) => [
      ...list,
      {
        id: data.id,
        name: data.name,
        subject: data.subject,
        htmlBody: data.htmlBody,
        createdAt: new Date(data.createdAt).toISOString(),
        updatedAt: new Date(data.updatedAt).toISOString(),
      },
    ]);
    setName("");
    setSubject("");
    if (createEditorRef.current) {
      createEditorRef.current.innerHTML = EMAIL_TEMPLATE_STARTER;
    }
    setMessage("Template created");
    router.refresh();
  }

  async function removeTemplate(template: EmailTemplateRow) {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    const res = await fetch(`/api/admin/email/templates/${template.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setTemplates((list) => list.filter((t) => t.id !== template.id));
    router.refresh();
  }

  async function previewTemplate(template: EmailTemplateRow) {
    const res = await fetch("/api/admin/email/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ htmlBody: template.htmlBody }),
    });
    if (res.ok) {
      const data = (await res.json()) as { html: string };
      setPreviewHtml(data.html);
    } else {
      setPreviewHtml(template.htmlBody);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Create template</h2>
        <p className="mt-1 text-sm text-gray-500">
          Save reusable subject lines and message bodies. Load them on the{" "}
          <Link href="/admin/email" className="text-brand-green hover:underline">
            Compose
          </Link>{" "}
          tab when sending bulk email.
        </p>
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-600">
                Template name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Shop outreach — spring"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">
                Default subject (optional)
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Partner with The Bean Book"
                className={inputClass}
              />
            </div>
          </div>
          <EmailHtmlEditor
            editorRef={createEditorRef}
            colors={colors}
            defaultHtml={EMAIL_TEMPLATE_STARTER}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Create template"}
          </button>
        </form>
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
            title="Template preview"
            srcDoc={previewHtml}
            className="mt-3 h-[360px] w-full rounded-lg border border-gray-200 bg-white"
          />
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Saved templates ({templates.length})
        </h2>
        {templates.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No templates yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {templates.map((template) => (
              <TemplateRow
                key={template.id}
                template={template}
                colors={colors}
                onPreview={previewTemplate}
                onRemove={removeTemplate}
                onUpdate={(updated) =>
                  setTemplates((list) =>
                    list.map((t) => (t.id === updated.id ? updated : t)),
                  )
                }
              />
            ))}
          </ul>
        )}
      </section>

      {message && (
        <p className="text-sm text-green-700" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function TemplateRow({
  template,
  colors,
  onPreview,
  onRemove,
  onUpdate,
}: {
  template: EmailTemplateRow;
  colors: BrandColors;
  onPreview: (t: EmailTemplateRow) => void;
  onRemove: (t: EmailTemplateRow) => void;
  onUpdate: (t: EmailTemplateRow) => void;
}) {
  const editEditorRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing && editEditorRef.current) {
      editEditorRef.current.innerHTML = template.htmlBody;
    }
  }, [editing, template.htmlBody]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/email/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        subject,
        htmlBody: editEditorRef.current?.innerHTML ?? template.htmlBody,
      }),
    });
    setSaving(false);
    if (!res.ok) return;
    const updated = (await res.json()) as EmailTemplateRow;
    onUpdate({
      id: updated.id,
      name: updated.name,
      subject: updated.subject,
      htmlBody: updated.htmlBody,
      createdAt:
        typeof updated.createdAt === "string"
          ? updated.createdAt
          : new Date(updated.createdAt).toISOString(),
      updatedAt:
        typeof updated.updatedAt === "string"
          ? updated.updatedAt
          : new Date(updated.updatedAt).toISOString(),
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="space-y-3 border-l-2 border-brand-green py-4 pl-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Template name"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClass}
          placeholder="Default subject"
        />
        <EmailHtmlEditor
          editorRef={editEditorRef}
          colors={colors}
          defaultHtml={template.htmlBody}
          minHeightClass="min-h-[200px]"
        />
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="text-brand-green hover:underline disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-gray-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-4">
      <div>
        <p className="font-medium text-gray-900">{template.name}</p>
        {template.subject && (
          <p className="mt-0.5 text-sm text-gray-600">
            Subject: {template.subject}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          Updated {new Date(template.updatedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          href={`/admin/email?template=${template.id}`}
          className="text-brand-green hover:underline"
        >
          Use in email
        </Link>
        <button
          type="button"
          onClick={() => onPreview(template)}
          className="text-gray-600 hover:underline"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-gray-600 hover:underline"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onRemove(template)}
          className="text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
