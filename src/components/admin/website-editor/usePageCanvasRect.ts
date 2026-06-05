"use client";

import { useCallback, useEffect, useState } from "react";
import { PAGE_CANVAS_ID } from "@/lib/site-config/free-buttons";

export type CanvasRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type CanvasMetrics = {
  /** Full page canvas in iframe document coordinates */
  docTop: number;
  docLeft: number;
  docWidth: number;
  docHeight: number;
  scrollX: number;
  scrollY: number;
  /** Visible slice of the canvas inside the iframe viewport */
  visible: CanvasRect;
};

function offsetInDocument(el: HTMLElement): { top: number; left: number } {
  let top = 0;
  let left = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    left += node.offsetLeft;
    node = node.offsetParent as HTMLElement | null;
  }
  return { top, left };
}

function measureCanvasMetrics(iframe: HTMLIFrameElement): CanvasMetrics | null {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) return null;

  const canvas =
    (doc.querySelector("[data-bb-page-bounds]") as HTMLElement | null) ??
    doc.getElementById(PAGE_CANVAS_ID);
  if (!canvas) return null;

  const header = doc.querySelector("header") as HTMLElement | null;
  const { top: docTop } = offsetInDocument(canvas);
  const docLeft = header ? offsetInDocument(header).left : offsetInDocument(canvas).left;
  const docWidth = header ? header.offsetWidth : canvas.offsetWidth;
  const docHeight = canvas.offsetHeight;
  const scrollX = win.scrollX;
  const scrollY = win.scrollY;
  const viewW = win.innerWidth;
  const viewH = win.innerHeight;

  const visTop = Math.max(0, docTop - scrollY);
  const visLeft = Math.max(0, docLeft - scrollX);
  const visBottom = Math.min(viewH, docTop + docHeight - scrollY);
  const visRight = Math.min(viewW, docLeft + docWidth - scrollX);

  const visible: CanvasRect = {
    top: visTop,
    left: visLeft,
    width: Math.max(0, visRight - visLeft),
    height: Math.max(0, visBottom - visTop),
  };

  if (docWidth < 1 || docHeight < 1) return null;

  return {
    docTop,
    docLeft,
    docWidth,
    docHeight,
    scrollX,
    scrollY,
    visible,
  };
}

export function usePageCanvasRect(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
  refreshKey: number,
) {
  const [metrics, setMetrics] = useState<CanvasMetrics | null>(null);
  const [iframeSize, setIframeSize] = useState({ width: 0, height: 0 });

  const measure = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !enabled) {
      setMetrics(null);
      setIframeSize({ width: 0, height: 0 });
      return;
    }

    setIframeSize({
      width: iframe.clientWidth,
      height: iframe.clientHeight,
    });
    setMetrics(measureCanvasMetrics(iframe));
  }, [iframeRef, enabled]);

  useEffect(() => {
    if (!enabled) {
      setMetrics(null);
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) return;

    let rafId = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    const onLoad = () => {
      scheduleMeasure();
      requestAnimationFrame(scheduleMeasure);
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      win?.addEventListener("scroll", scheduleMeasure, { passive: true });
      win?.addEventListener("resize", scheduleMeasure);
      doc?.addEventListener("scroll", scheduleMeasure, { passive: true });
    };

    iframe.addEventListener("load", onLoad);
    if (iframe.contentDocument?.readyState === "complete") onLoad();

    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(iframe);

    let canvasRo: ResizeObserver | null = null;
    const attachCanvasObserver = () => {
      const canvas =
        iframe.contentDocument?.querySelector("[data-bb-page-bounds]") ??
        iframe.contentDocument?.getElementById(PAGE_CANVAS_ID);
      if (canvas && !canvasRo) {
        canvasRo = new ResizeObserver(scheduleMeasure);
        canvasRo.observe(canvas);
      }
    };
    attachCanvasObserver();
    const attachTimer = window.setInterval(attachCanvasObserver, 500);

    return () => {
      cancelAnimationFrame(rafId);
      iframe.removeEventListener("load", onLoad);
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      win?.removeEventListener("scroll", scheduleMeasure);
      win?.removeEventListener("resize", scheduleMeasure);
      doc?.removeEventListener("scroll", scheduleMeasure);
      ro.disconnect();
      canvasRo?.disconnect();
      window.clearInterval(attachTimer);
    };
  }, [iframeRef, enabled, measure, refreshKey]);

  const clientToPercent = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const iframe = iframeRef.current;
      if (!iframe || !metrics || metrics.docWidth < 1 || metrics.docHeight < 1) {
        return null;
      }

      const iframeRect = iframe.getBoundingClientRect();
      const docX = clientX - iframeRect.left + metrics.scrollX;
      const docY = clientY - iframeRect.top + metrics.scrollY;

      return {
        x: ((docX - metrics.docLeft) / metrics.docWidth) * 100,
        y: ((docY - metrics.docTop) / metrics.docHeight) * 100,
      };
    },
    [iframeRef, metrics],
  );

  const percentToOverlayStyle = useCallback(
    (x: number, y: number): { left: number; top: number } | null => {
      if (!metrics) return null;
      const docX = metrics.docLeft + (x / 100) * metrics.docWidth;
      const docY = metrics.docTop + (y / 100) * metrics.docHeight;
      return {
        left: docX - metrics.scrollX,
        top: docY - metrics.scrollY,
      };
    },
    [metrics],
  );

  return {
    canvasRect: metrics?.visible ?? null,
    iframeSize,
    remeasure: measure,
    clientToPercent,
    percentToOverlayStyle,
  };
}
