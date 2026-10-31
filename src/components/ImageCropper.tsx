import React, { useEffect, useRef, useState } from 'react';

type Rect = { x: number; y: number; w: number; h: number };

interface Props {
  source: string;
  onCropped: (dataUrl: string, width: number, height: number) => void;
}

// Drag on the preview to crop; emits the cropped image whenever the crop changes.
const ImageCropper = ({ source, onCropped }: Props) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  const startPt = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const i = new Image();
    i.onload = () => { setImg(i); setRect(null); };
    i.src = source;
  }, [source]);

  useEffect(() => {
    const c = ref.current;
    if (!c || !img) return;
    const s = Math.min(1, 268 / img.width, 220 / img.height);
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    if (rect && rect.w > 2 && rect.h > 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, rect.x / s, rect.y / s, rect.w / s, rect.h / s, rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([5, 3]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  }, [img, rect]);

  const emit = (r: Rect | null) => {
    const c = ref.current;
    if (!img || !c) return;
    const k = img.width / c.width;
    const src = r ? { x: r.x * k, y: r.y * k, w: r.w * k, h: r.h * k } : { x: 0, y: 0, w: img.width, h: img.height };
    const out = document.createElement('canvas');
    const down = Math.min(1, 1600 / src.w);
    out.width = Math.max(1, Math.round(src.w * down));
    out.height = Math.max(1, Math.round(src.h * down));
    out.getContext('2d')!.drawImage(img, src.x, src.y, src.w, src.h, 0, 0, out.width, out.height);
    onCropped(out.toDataURL('image/png'), out.width, out.height);
  };

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!;
    const b = c.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(c.width, ((e.clientX - b.left) * c.width) / b.width)),
      y: Math.max(0, Math.min(c.height, ((e.clientY - b.top) * c.height) / b.height)),
    };
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Drag a rectangle to keep only that part of the image</span>
        {rect && <button className="underline" onClick={() => { setRect(null); emit(null); }}>Reset crop</button>}
      </div>
      <canvas
        ref={ref}
        className="border rounded cursor-crosshair touch-none max-w-full"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startPt.current = pos(e); setRect(null); }}
        onPointerMove={(e) => {
          const s = startPt.current;
          if (!s) return;
          const p = pos(e);
          setRect({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
        }}
        onPointerUp={() => {
          startPt.current = null;
          if (rect && rect.w > 5 && rect.h > 5) emit(rect);
          else { setRect(null); }
        }}
      />
    </div>
  );
};

export default ImageCropper;
