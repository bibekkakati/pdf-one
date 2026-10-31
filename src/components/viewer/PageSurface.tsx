import React, { forwardRef, useEffect, useState } from 'react';
import { Page } from 'react-pdf';
import type { PageEntry } from '@/lib/pageModel';

interface Props {
  entry: PageEntry;
  scale: number;
  className?: string;
  /** Canvas pixel ratio; thumbnails use 1 to render faster. */
  dpr?: number;
  onRendered?: () => void;
  children?: React.ReactNode;
}

/** Converts a pointer position into page pixels (scale 1) of a surface's inner box. */
export function toLocal(inner: HTMLElement, scale: number, clientX: number, clientY: number) {
  const r = inner.getBoundingClientRect();
  return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale };
}

/** Placeholder shown while the page canvas is being rendered. */
export const PageSkeleton = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-muted/40" aria-hidden="true" data-testid="page-skeleton">
    <div className="w-[64%] max-w-xs animate-pulse space-y-2.5">
      <div className="mx-auto h-3.5 w-1/2 rounded bg-border" />
      <div className="h-2 rounded bg-border" />
      <div className="h-2 w-[94%] rounded bg-border" />
      <div className="h-2 w-[88%] rounded bg-border" />
      <div className="h-2 rounded bg-border" />
      <div className="h-2 w-[70%] rounded bg-border" />
      <div className="mt-5 h-2 rounded bg-border" />
      <div className="h-2 w-[92%] rounded bg-border" />
      <div className="h-2 w-[80%] rounded bg-border" />
      <div className="mt-5 h-2 rounded bg-border" />
      <div className="h-2 w-[64%] rounded bg-border" />
    </div>
  </div>
);

/** A page (original or blank) at a scale; children overlay in page space. */
const PageSurface = forwardRef<HTMLDivElement, Props>(({ entry, scale, className = '', dpr, onRendered, children }, ref) => {
  const blank = entry.source === null;
  // Reset on page or zoom change so the skeleton covers each new render
  const [ready, setReady] = useState(blank);
  useEffect(() => { setReady(blank); if (blank) onRendered?.(); }, [entry.id, entry.source, scale, blank]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={ref} className={`relative bg-white ${className}`} style={{ width: entry.w * scale, height: entry.h * scale }}>
      {entry.source !== null && (
        <Page pageNumber={entry.source + 1} scale={scale} renderAnnotationLayer={false} renderTextLayer={false}
          className="!shadow-none" loading={null} devicePixelRatio={dpr} onRenderSuccess={() => { setReady(true); onRendered?.(); }} />
      )}
      {!ready && <PageSkeleton />}
      {children}
    </div>
  );
});
PageSurface.displayName = 'PageSurface';

export default PageSurface;
