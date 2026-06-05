export default function WebsitePagesEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">{children}</div>
  );
}
