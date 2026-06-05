type DraftSidebarCardProps = {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function DraftSidebarCard({
  title,
  action,
  children,
}: DraftSidebarCardProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}
