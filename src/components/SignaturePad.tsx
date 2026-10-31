import React, { useEffect, useRef, useState } from 'react';
import SignatureCanvas from '@/components/SignatureCanvas';
import UploadDropzone from '@/components/UploadDropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { PenLine, Plus } from 'lucide-react';
import { trimCanvas } from '@/lib/trimCanvas';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface Props {
  onPlaceSignature: (signature: string) => void;
}

const FONTS = [
  { name: 'Dancing Script', css: "'Dancing Script', cursive" },
  { name: 'Great Vibes', css: "'Great Vibes', cursive" },
  { name: 'Caveat', css: "'Caveat', cursive" },
  { name: 'Homemade Apple', css: "'Homemade Apple', cursive" },
];

const TypeSignature = ({ onPlaceSignature }: Props) => {
  const [name, setName] = useState('');
  const [font, setFont] = useState(FONTS[0]);
  const [color, setColor] = useState('#000000');
  const [signature, setSignature] = useState('');

  useEffect(() => {
    setSignature('');
    if (!name.trim()) return;
    let cancelled = false;
    const render = async () => {
      try { await document.fonts.load(`80px ${font.css}`); } catch { /* ignore */ }
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.font = `80px ${font.css}`;
      const w = Math.ceil(ctx.measureText(name).width) + 80;
      canvas.width = w;
      canvas.height = 200;
      ctx.font = `80px ${font.css}`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 40, 100);
      const url = trimCanvas(canvas);
      setSignature(url || '');
    };
    const t = setTimeout(render, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [name, font, color]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">Type your full name, pick a style and ink, then place it on the page.</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your full name"
        className="w-full border rounded px-3 py-2 text-sm"
        maxLength={40}
      />
      <div className="grid grid-cols-2 gap-2">
        {FONTS.map((f) => (
          <button
            key={f.name}
            onClick={() => setFont(f)}
            className={`border rounded px-1.5 py-1.5 text-base truncate transition-colors ${font.name === f.name ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
            style={{ fontFamily: f.css, color }}
            title={f.name}
          >
            {name || 'Signature'}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        Ink color:
        {['#000000', '#1e3a8a', '#1d4ed8'].map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
            style={{ background: c }}
            aria-label={`Ink color ${c}`}
          />
        ))}
      </div>
      {signature && (
        <Button size="sm" className="w-full" onClick={() => onPlaceSignature(signature)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Place signature
        </Button>
      )}
    </div>
  );
};

type Filter = 'original' | 'sharp' | 'bold' | 'blue';
type Rect = { x: number; y: number; w: number; h: number };

const UploadSignature = ({ onPlaceSignature }: Props) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Rect | null>(null);
  const [removeBg, setRemoveBg] = useState(true);
  const [threshold, setThreshold] = useState(170);
  const [filter, setFilter] = useState<Filter>('sharp');
  const [preview, setPreview] = useState('');
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [dragRect, setDragRect] = useState<Rect | null>(null);

  const onFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const i = new Image();
      i.onload = () => { setImg(i); setCrop(null); setDragRect(null); };
      i.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Draw the crop selection canvas
  useEffect(() => {
    const c = cropCanvasRef.current;
    if (!c || !img) return;
    const maxW = 280;
    const scale = Math.min(1, maxW / img.width, 200 / img.height);
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const r = dragRect;
    if (r && r.w > 2 && r.h > 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, r.x / scale, r.y / scale, r.w / scale, r.h / scale, r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
  }, [img, dragRect]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = cropCanvasRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(c.width, ((e.clientX - rect.left) * c.width) / rect.width)),
      y: Math.max(0, Math.min(c.height, ((e.clientY - rect.top) * c.height) / rect.height)),
    };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = pos(e);
    setDragRect(null);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStart.current) return;
    const p = pos(e), s = dragStart.current;
    setDragRect({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };
  const onUp = () => {
    dragStart.current = null;
    const c = cropCanvasRef.current;
    if (!c || !img) return;
    if (dragRect && dragRect.w > 5 && dragRect.h > 5) {
      const s = img.width / c.width;
      setCrop({ x: dragRect.x * s, y: dragRect.y * s, w: dragRect.w * s, h: dragRect.h * s });
    } else {
      setDragRect(null);
      setCrop(null);
    }
  };

  // Process image -> signature
  useEffect(() => {
    if (!img) return;
    const r = crop ?? { x: 0, y: 0, w: img.width, h: img.height };
    const scale = Math.min(1, 1200 / r.w);
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(r.w * scale));
    c.height = Math.max(1, Math.round(r.h * scale));
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height);
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      let alpha = d[i + 3];
      if (removeBg) {
        // Soft edge: fully transparent above threshold, ramps to opaque when darker
        const soft = 40;
        alpha = lum >= threshold ? 0 : Math.min(255, ((threshold - lum) / soft) * 255) * (alpha / 255);
      }
      if (filter === 'sharp') {
        const v = lum < threshold ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = removeBg ? 0 : v;
        if (removeBg) alpha = alpha > 60 ? 255 : 0;
      } else if (filter === 'bold') {
        d[i] = d[i + 1] = d[i + 2] = removeBg ? 0 : Math.max(0, (lum - 60) * 1.6);
        if (removeBg) alpha = Math.min(255, alpha * 1.8);
      } else if (filter === 'blue') {
        if (removeBg) { d[i] = 30; d[i + 1] = 58; d[i + 2] = 138; }
        else { const k = lum / 255; d[i] = 30 + k * 225; d[i + 1] = 58 + k * 197; d[i + 2] = 138 + k * 117; }
      }
      d[i + 3] = alpha;
    }
    ctx.putImageData(id, 0, 0);

    if (filter === 'bold' && removeBg) {
      // Thicken strokes slightly
      const b = document.createElement('canvas');
      b.width = c.width; b.height = c.height;
      const bctx = b.getContext('2d')!;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) bctx.drawImage(c, dx, dy);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(b, 0, 0);
    }

    const url = removeBg ? trimCanvas(c) : c.toDataURL('image/png');
    setPreview(url);
  }, [img, crop, removeBg, threshold, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: 'original', label: 'Original' },
    { id: 'sharp', label: 'Sharp' },
    { id: 'bold', label: 'Bold' },
    { id: 'blue', label: 'Blue ink' },
  ];

  return (
    <div className="space-y-4">
      <UploadDropzone
        onFile={onFile}
        label={img ? 'Choose a different image' : 'Choose a signature image (PNG, JPG)'}
      />

      {img && (
        <>
          <div>
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
              <span>Drag a rectangle to keep only that part of the image</span>
              {crop && (
                <button className="underline" onClick={() => { setCrop(null); setDragRect(null); }}>
                  Reset crop
                </button>
              )}
            </div>
            <canvas
              ref={cropCanvasRef}
              className="border rounded cursor-crosshair touch-none max-w-full"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>Remove background</span>
            <Switch checked={removeBg} onCheckedChange={setRemoveBg} />
          </div>
          <div className="text-sm text-foreground">
            <div className="flex justify-between mb-2">
              <span>Background removal</span>
              <span className="text-muted-foreground">{threshold}</span>
            </div>
            <Slider min={60} max={240} step={5} value={[threshold]} onValueChange={(v) => setThreshold(v[0])} />
            <p className="text-xs text-muted-foreground mt-1.5">Raise it to remove lighter backgrounds; lower it to keep faint strokes.</p>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                title={{ original: 'Keep the image as it is', sharp: 'Crisp dark strokes on a clean background', bold: 'Thicker, darker strokes', blue: 'Tint the ink blue' }[f.id]}
                className={`border rounded px-1 py-1.5 text-xs transition-colors ${filter === f.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {preview && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Preview</div>
              <div
                className="border rounded p-2 flex justify-center"
                style={{ backgroundImage: 'repeating-conic-gradient(#f3f4f6 0% 25%, #fff 0% 50%)', backgroundSize: '16px 16px' }}
              >
                <img src={preview} alt="Processed signature" className="max-h-24 object-contain" />
              </div>
            </div>
          )}
        </>
      )}
      {preview && (
        <Button size="sm" className="w-full" onClick={() => onPlaceSignature(preview)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Place signature
        </Button>
      )}
    </div>
  );
};

const DrawSignature = ({ onPlaceSignature }: Props) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState('');
  const [drawn, setDrawn] = useState('');
  return (
    <div className="space-y-4">
      {drawn && (
        <div className="rounded-md border bg-muted/30 p-2 flex justify-center">
          <img src={drawn} alt="Your drawn signature" className="max-h-16 object-contain" />
        </div>
      )}
      <Button variant="outline" size="sm" className="w-full" onClick={() => { setPending(''); setOpen(true); }}>
        <PenLine className="w-4 h-4 mr-1" /> {drawn ? 'Redraw Sign' : 'Draw Sign'}
      </Button>
      <p className="text-xs text-muted-foreground leading-relaxed">Opens a signing pad. Your signature is trimmed to the ink and kept here until you redraw it.</p>
      {drawn && (
        <Button size="sm" className="w-full" onClick={() => onPlaceSignature(drawn)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Place signature
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl gap-5">
          <DialogHeader>
            <DialogTitle>Draw your signature</DialogTitle>
            <DialogDescription>Sign with a mouse, pen or finger — empty space around your signature is trimmed away automatically.</DialogDescription>
          </DialogHeader>
          <SignatureCanvas onSignatureCreated={setPending} />
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!pending} onClick={() => { setDrawn(pending); setOpen(false); }}>Use signature</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const trig = 'py-2.5 text-sm font-semibold leading-5 text-foreground tracking-normal hover:no-underline';
const SignaturePad = ({ onPlaceSignature }: Props) => (
  <Accordion type="single" collapsible defaultValue="type" className="-mx-3 -mt-3 border-b">
    <AccordionItem value="type" className="px-3 [&>div]:!animate-none [&>div]:!h-auto [&>div[data-state=closed]]:hidden">
      <AccordionTrigger className={trig}>Type</AccordionTrigger>
      <AccordionContent forceMount><TypeSignature onPlaceSignature={onPlaceSignature} /></AccordionContent>
    </AccordionItem>
    <AccordionItem value="upload" className="px-3 [&>div]:!animate-none [&>div]:!h-auto [&>div[data-state=closed]]:hidden">
      <AccordionTrigger className={trig}>Upload</AccordionTrigger>
      <AccordionContent forceMount><UploadSignature onPlaceSignature={onPlaceSignature} /></AccordionContent>
    </AccordionItem>
    <AccordionItem value="draw" className="px-3 border-b-0 [&>div]:!animate-none [&>div]:!h-auto [&>div[data-state=closed]]:hidden">
      <AccordionTrigger className={trig}>Draw</AccordionTrigger>
      <AccordionContent forceMount><DrawSignature onPlaceSignature={onPlaceSignature} /></AccordionContent>
    </AccordionItem>
  </Accordion>
);

export default SignaturePad;
