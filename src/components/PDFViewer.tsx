import React, { useState, useRef, useEffect } from 'react';
import { Document, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, RotateCcw } from 'lucide-react';
import { EditorElement, KEEP_ASPECT, TEXT_LINE_HEIGHT } from '@/lib/editorElements';
import { INITIAL_PDF_SCALE } from '@/lib/downloadState';
import type { PageEntry } from '@/lib/pageModel';
import type { SetOptions } from '@/hooks/useHistoryState';
import ElementOverlay from '@/components/viewer/ElementOverlay';
import PageControls from '@/components/viewer/PageControls';
import PageSurface, { PageSkeleton, toLocal } from '@/components/viewer/PageSurface';

const THUMB_W = 74;

// Thumbnail that only renders its canvas while scrolled into view
const Thumb = ({ entry, number, active, onClick, root, enabled }: { entry: PageEntry; number: number; active: boolean; onClick: () => void; root: React.RefObject<HTMLDivElement>; enabled: boolean }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { root: root.current, rootMargin: '0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [root]);
  useEffect(() => { if (active) ref.current?.scrollIntoView({ block: 'nearest' }); }, [active]);
  const size = { w: entry.w, h: entry.h };
  const s = THUMB_W / size.w;
  return (
    <button ref={ref} onClick={onClick} className="flex flex-col items-center gap-1.5 w-full" aria-label={`Go to page ${number}`} aria-current={active}>
      <div className={`relative w-[78px] shrink-0 bg-background rounded-md overflow-hidden border-2 transition-colors ${active ? 'border-primary' : 'border-border hover:border-muted-foreground/40'}`}>
        <div style={{ height: size.h * s }} className={entry.deleted ? 'opacity-30' : ''}>
          {visible && enabled && <PageSurface entry={entry} scale={s} dpr={1} />}
        </div>
        {entry.deleted && <span className="absolute inset-x-0 bottom-0 bg-destructive text-destructive-foreground text-[9px] font-medium py-0.5">Deleted</span>}
      </div>
      <span className={`inline-flex items-center gap-1 text-xs ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{active && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}{number}</span>
    </button>
  );
};

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface PDFViewerProps {
  file: string | File;
  pages: PageEntry[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  elements: EditorElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<EditorElement>, opts?: SetOptions) => void;
  onDelete: (id: string) => void;
  onRestorePage: (id: string) => void;
  showGrid: boolean;
  draw: { color: string; width: number } | null;
  onStroke: (points: [number, number][]) => void;
}

// `key` is unique per pointer-down so one whole drag/resize becomes a single undo step
type Gesture = { id: string; key: string; mode: 'move' | 'resize'; startX: number; startY: number; orig: EditorElement; moved: boolean };
let gestureCount = 0;

const PDFViewer = ({ file, pages, currentIndex, onIndexChange, elements, selectedId, onSelect, onChange, onDelete, onRestorePage, showGrid, draw, onStroke }: PDFViewerProps) => {
  const numPages = pages.length;
  const currentPage = currentIndex + 1;
  const entry = pages[currentIndex];
  const [pageInput, setPageInput] = useState('1');
  const [scale, setScale] = useState(INITIAL_PDF_SCALE);
  const [thumbsOpen, setThumbsOpen] = useState(true);
  const [stroke, setStroke] = useState<[number, number][] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  // Thumbnails wait until the main page has painted so they don't compete for the PDF worker
  const [mainPainted, setMainPainted] = useState(false);

  useEffect(() => { setScale(INITIAL_PDF_SCALE); setMainPainted(false); }, [file]);
  useEffect(() => { setPageInput(String(currentPage)); }, [currentPage]);

  const navigateToPage = (page: number) => {
    const target = Math.max(1, Math.min(numPages, Math.trunc(page)));
    setPageInput(String(target));
    if (target === currentPage) return;
    onIndexChange(target - 1);
    onSelect(null);
    gesture.current = null;
    containerRef.current?.scrollTo({ top: 0 });
  };

  const commitPageInput = () => {
    const value = Number(pageInput);
    if (!pageInput.trim() || !Number.isInteger(value)) { setPageInput(String(currentPage)); return; }
    navigateToPage(value);
  };

  const start = (e: React.PointerEvent<HTMLElement>, el: EditorElement, mode: Gesture['mode']) => {
    e.stopPropagation();
    if (mode === 'resize') e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { id: el.id, key: `gesture:${++gestureCount}`, mode, startX: e.clientX, startY: e.clientY, orig: el, moved: false };
    onSelect(el.id);
  };
  const move = (e: React.PointerEvent<HTMLElement>) => {
    const g = gesture.current;
    if (!g || !entry) return;
    const ldx = e.clientX - g.startX, ldy = e.clientY - g.startY;
    const dx = ldx / scale, dy = ldy / scale;
    if (Math.abs(dx) + Math.abs(dy) > 1) g.moved = true;
    if (!g.moved) return;
    const pw = entry.w, ph = entry.h;
    const o = g.orig;
    const step: SetOptions = { mergeKey: g.key, mergeMs: Infinity };
    if (g.mode === 'move') {
      onChange(g.id, { x: Math.max(0, Math.min(o.x + dx, pw - o.w)), y: Math.max(0, Math.min(o.y + dy, ph - o.h)) }, step);
    } else {
      const minW = 16, minH = o.type === 'text' ? (o.fontSize || 16) * TEXT_LINE_HEIGHT : 10;
      let w = Math.max(minW, Math.min(o.w + dx, pw - o.x));
      let h = KEEP_ASPECT[o.type] ? w * (o.h / o.w) : Math.max(minH, Math.min(o.h + dy, ph - o.y));
      if (KEEP_ASPECT[o.type] && o.y + h > ph) { h = ph - o.y; w = h * (o.w / o.h); }
      onChange(g.id, { w, h }, step);
    }
  };
  const end = () => { gesture.current = null; };

  // Freehand drawing capture (sits below placed elements so they stay selectable)
  const local = (e: React.PointerEvent): [number, number] => {
    const p = toLocal(innerRef.current!, scale, e.clientX, e.clientY);
    return [Math.max(0, Math.min(entry.w, p.x)), Math.max(0, Math.min(entry.h, p.y))];
  };
  const drawStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect(null);
    setStroke([local(e)]);
  };
  const drawMove = (e: React.PointerEvent<HTMLDivElement>) => { if (stroke) setStroke([...stroke, local(e)]); };
  const drawEnd = () => { if (stroke) onStroke(stroke); setStroke(null); };

  const canEdit = entry && !entry.deleted;

  return (
    <Document file={file} className="flex h-full w-full min-h-0" loading={
      <div className="flex h-full w-full min-h-0" role="status" aria-label="Loading PDF" data-testid="document-skeleton">
        <div className={`hidden md:block shrink-0 border-r bg-card ${thumbsOpen ? 'w-28' : 'w-9'}`} />
        <div className="flex-1 min-w-0 overflow-auto bg-muted/40">
          <div className="flex flex-col items-center pt-8 pb-24 px-8">
            {entry && <div className="relative shrink-0 shadow-paper" style={{ width: entry.w * scale, height: entry.h * scale }}><PageSkeleton /></div>}
          </div>
        </div>
      </div>
    }>
      {thumbsOpen ? (
        <aside ref={thumbsRef} className="hidden md:flex w-28 shrink-0 flex-col gap-3 overflow-y-auto border-r bg-card px-2 pt-4 pb-1">
          {pages.map((p, i) => (
            <Thumb key={p.id} entry={p} number={i + 1} active={currentIndex === i} root={thumbsRef} enabled={mainPainted} onClick={() => navigateToPage(i + 1)} />
          ))}
          <div className="sticky bottom-0 z-10 mt-auto -mx-2 px-1 py-1 flex justify-end bg-card border-t">
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Hide pages panel" title="Hide pages panel" onClick={() => setThumbsOpen(false)}>
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </aside>
      ) : (
        <div className="hidden md:flex w-9 shrink-0 flex-col items-center justify-end border-r bg-card pb-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Show pages panel" title="Show pages panel" onClick={() => setThumbsOpen(true)}>
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="pdf-viewer flex-1 min-w-0 overflow-auto bg-muted/40 relative" ref={containerRef}>
        <div className="relative" onPointerDown={() => onSelect(null)}>
          <div className="flex flex-col items-center pt-8 pb-24 px-8">
            {entry && (
              <div key={entry.id} className="relative">
                <PageSurface ref={innerRef} entry={entry} scale={scale} onRendered={() => setMainPainted(true)} className={`shadow-paper ring-1 ring-foreground/[0.04] ${entry.deleted ? 'opacity-40' : ''}`}>
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none z-[6] bg-grid-ref" style={{ backgroundSize: `${18 * scale}px ${18 * scale}px` }} data-testid="page-grid">
                      <div className="absolute border border-dashed border-grid-margin" style={{ inset: 36 * scale }} />
                    </div>
                  )}
                  {canEdit && draw && (
                    <div className="absolute inset-0 z-[5] cursor-crosshair touch-none" data-testid="draw-layer"
                      onPointerDown={drawStart} onPointerMove={drawMove} onPointerUp={drawEnd} onPointerCancel={drawEnd} />
                  )}
                  {stroke && draw && (
                    <svg className="absolute inset-0 z-20 pointer-events-none" width={entry.w * scale} height={entry.h * scale}>
                      <polyline points={stroke.map(([x, y]) => `${x * scale},${y * scale}`).join(' ')} fill="none" stroke={draw.color}
                        strokeWidth={draw.width * scale} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <div className={canEdit ? '' : 'pointer-events-none'}>
                    {elements.filter(el => el.pageId === entry.id).map((el) => (
                      <ElementOverlay key={el.id} element={el} scale={scale} selected={selectedId === el.id}
                        onStart={(e, mode) => start(e, el, mode)} onMove={move} onEnd={end} onDelete={() => onDelete(el.id)} />
                    ))}
                  </div>
                </PageSurface>
                {entry.deleted && (
                  <div className="absolute inset-0 grid place-items-center z-30" onPointerDown={e => e.stopPropagation()}>
                    <div className="flex flex-col items-center gap-2 rounded-lg border bg-background px-4 py-3 shadow-lg">
                      <p className="text-sm font-medium">This page will be deleted when you download</p>
                      <Button size="sm" variant="outline" onClick={() => onRestorePage(entry.id)}><RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore page</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <PageControls currentPage={currentPage} numPages={numPages} pageInput={pageInput} scale={scale}
          onPageInput={setPageInput} onCommitPageInput={commitPageInput} onNavigate={navigateToPage} onScale={setScale} />
      </div>
    </Document>
  );
};

export default PDFViewer;
