import Link from "next/link";

type OrderDetailNavProps = {
  newerId: string | null;
  olderId: string | null;
  fromQuery: string;
};

function orderHref(id: string, fromQuery: string): string {
  const base = `/admin/orders/${id}`;
  return fromQuery ? `${base}?from=${fromQuery}` : base;
}

export function OrderDetailNav({
  newerId,
  olderId,
  fromQuery,
}: OrderDetailNavProps) {
  const btnClass =
    "inline-flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex overflow-hidden rounded-md border border-gray-300">
      {newerId ? (
        <Link
          href={orderHref(newerId, fromQuery)}
          className={btnClass}
          aria-label="Newer order"
          title="Newer order"
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
          href={orderHref(olderId, fromQuery)}
          className={`${btnClass} border-l border-gray-300`}
          aria-label="Older order"
          title="Older order"
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
