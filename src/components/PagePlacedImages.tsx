"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { PlacedPageImage } from "@/lib/pages/placed-images";
import { pathnameToPageSlug } from "@/lib/site-config/free-buttons";

export function PagePlacedImages() {
  const pathname = usePathname();
  const pageSlug = pathnameToPageSlug(pathname);
  const variant = pathname.startsWith("/preview") ? "draft" : "published";
  const [images, setImages] = useState<PlacedPageImage[]>([]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ slug: pageSlug, variant });
    fetch(`/api/placed-images?${params}`)
      .then((res) => res.json())
      .then((data: { images?: PlacedPageImage[] }) => {
        if (!cancelled) setImages(data.images ?? []);
      })
      .catch(() => {
        if (!cancelled) setImages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pageSlug, variant]);

  if (images.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden={false}>
      {images.map((img) => (
        <div
          key={img.id}
          className="pointer-events-none absolute"
          style={{
            left: `${img.x}%`,
            top: `${img.y}%`,
            width: `${img.width ?? 28}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.alt ?? ""}
            className="h-auto w-full rounded shadow-md"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
