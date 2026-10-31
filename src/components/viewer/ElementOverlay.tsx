import React from 'react';
import { Trash2 } from 'lucide-react';
import { EditorElement, TEXT_LINE_HEIGHT, HIGHLIGHT_OPACITY } from '@/lib/editorElements';

type PointerHandler = (e: React.PointerEvent<HTMLElement>) => void;

interface Props {
  element: EditorElement;
  scale: number;
  selected: boolean;
  onStart: (e: React.PointerEvent<HTMLElement>, mode: 'move' | 'resize') => void;
  onMove: PointerHandler;
  onEnd: () => void;
  onDelete: () => void;
}

/** One placed element drawn over the page, with selection handles, resize dot and delete button. */
const ElementOverlay = ({ element: el, scale, selected, onStart, onMove, onEnd, onDelete }: Props) => (
  <div
    data-element={el.type}
    className={`absolute z-10 cursor-move touch-none select-none ${selected ? 'outline outline-1 outline-primary' : 'hover:outline hover:outline-1 hover:outline-primary/50'}`}
    style={{ left: el.x * scale, top: el.y * scale, width: el.w * scale, height: el.h * scale, background: el.type === 'mask' ? el.color : undefined }}
    onPointerDown={(e) => onStart(e, 'move')}
    onPointerMove={onMove}
    onPointerUp={onEnd}
    onPointerCancel={onEnd}
  >
    {el.type === 'highlight' && (
      <div className="absolute inset-0 pointer-events-none mix-blend-multiply" style={{ background: el.color, opacity: HIGHLIGHT_OPACITY }} />
    )}
    {el.type === 'draw' && (
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 1 1" preserveAspectRatio="none">
        <polyline points={(el.points || []).map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={el.color}
          strokeWidth={(el.strokeWidth || 2) * scale} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
    {(el.type === 'signature' || el.type === 'image') && el.src && (
      <img src={el.src} alt={el.type} draggable={false} className="w-full h-full object-contain pointer-events-none" />
    )}
    {el.type === 'text' && (
      <div className="w-full h-full overflow-hidden whitespace-pre pointer-events-none"
        style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: (el.fontSize || 16) * scale, lineHeight: TEXT_LINE_HEIGHT, color: el.color, paddingLeft: 4 * scale, fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? 'italic' : 'normal', textDecoration: el.underline ? 'underline' : 'none' }}>
        {el.text || ' '}
      </div>
    )}
    {selected && (<>
      {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1'].map(pos => (
        <span key={pos} className={`absolute ${pos} w-2 h-2 rounded-full bg-background border border-primary pointer-events-none`} />
      ))}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 flex items-center rounded-md border bg-background shadow-md p-0.5" onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-foreground" aria-label="Delete element" title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background cursor-se-resize shadow"
        onPointerDown={(e) => onStart(e, 'resize')} onPointerMove={onMove} onPointerUp={onEnd} onPointerCancel={onEnd} aria-label="Resize" />
    </>)}
  </div>
);

export default ElementOverlay;
