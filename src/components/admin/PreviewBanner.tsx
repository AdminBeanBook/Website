import Link from "next/link";

export function PreviewBanner() {
  return (
    <div
      data-bb-preview-banner
      className="sticky top-0 z-50 border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm text-amber-950"
    >
      <span className="font-medium">Preview</span> — you are viewing draft
      changes. They are not visible on the live site until you publish.{" "}
      <Link href="/admin/settings/pages" className="font-medium underline hover:no-underline">
        Back to editor
      </Link>
    </div>
  );
}
