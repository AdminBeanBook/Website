import { PageFreeButtons } from "@/components/PageFreeButtons";
import { PagePlacedImages } from "@/components/PagePlacedImages";
import { PAGE_CANVAS_ID } from "@/lib/site-config";

type PageMainCanvasProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageMainCanvas({ children, className }: PageMainCanvasProps) {
  return (
    <main
      id={PAGE_CANVAS_ID}
      className={`relative block w-full ${className ?? ""}`}
    >
      <div data-bb-page-bounds className="relative w-full">
        {children}
        <PagePlacedImages />
        <PageFreeButtons />
      </div>
    </main>
  );
}
