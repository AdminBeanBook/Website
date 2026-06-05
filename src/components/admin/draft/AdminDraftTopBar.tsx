import Link from "next/link";

type AdminDraftTopBarProps = {
  title: string;
  discardHref: string;
  onSave?: () => void;
  saveLabel?: string;
  saving?: boolean;
  saveDisabled?: boolean;
  formId?: string;
  extraActions?: React.ReactNode;
};

export function AdminDraftTopBar({
  title,
  discardHref,
  onSave,
  saveLabel = "Save",
  saving = false,
  saveDisabled = false,
  formId,
  extraActions,
}: AdminDraftTopBarProps) {
  return (
    <div className="-mx-4 sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur sm:-mx-0 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          <Link
            href={discardHref}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Discard
          </Link>
          {formId ? (
            <button
              type="submit"
              form={formId}
              disabled={saveDisabled || saving}
              className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : saveLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSave}
              disabled={saveDisabled || saving}
              className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : saveLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
