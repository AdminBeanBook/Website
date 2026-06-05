import Link from "next/link";

type MessageDetailNavProps = {
  newerId: string | null;
  olderId: string | null;
};

export function MessageDetailNav({ newerId, olderId }: MessageDetailNavProps) {
  const btnClass =
    "inline-flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex overflow-hidden rounded-md border border-gray-300">
      {newerId ? (
        <Link
          href={`/admin/messages/${newerId}`}
          className={btnClass}
          aria-label="Newer message"
          title="Newer message"
        >
          ↑
        </Link>
      ) : (
        <span className={btnClass} aria-hidden>
          ↑
        </span>
      )}
      {olderId ? (
        <Link
          href={`/admin/messages/${olderId}`}
          className={`${btnClass} border-l border-gray-300`}
          aria-label="Older message"
          title="Older message"
        >
          ↓
        </Link>
      ) : (
        <span className={`${btnClass} border-l border-gray-300`} aria-hidden>
          ↓
        </span>
      )}
    </div>
  );
}
