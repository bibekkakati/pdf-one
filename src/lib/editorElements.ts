import { PDFDocument, StandardFonts, rgb, LineCapStyle } from 'pdf-lib';
import type { PageEntry } from './pageModel';

export type ElementType = 'signature' | 'image' | 'mask' | 'text' | 'highlight' | 'draw';

// All geometry is stored in PDF points (scale 1), top-left origin, in the page's unrotated display space.
export interface EditorElement {
  id: string;
  type: ElementType;
  pageId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  src?: string;        // signature / image (cropped result)
  original?: string;   // image: uncropped source for re-cropping
  color?: string;      // mask / highlight fill, text / stroke color
  text?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  points?: [number, number][]; // draw: points normalized 0..1 inside the box
  strokeWidth?: number;        // draw: stroke width in points
}

export const TEXT_LINE_HEIGHT = 1.2;
export const HIGHLIGHT_OPACITY = 0.45;
export const KEEP_ASPECT: Record<ElementType, boolean> = { signature: true, image: true, mask: false, text: false, highlight: false, draw: false };

export const newId = () => Math.random().toString(36).slice(2, 10);

const hexToRgb = (hex = '#000000') => {
  const n = parseInt(hex.replace('#', ''), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/** Turns a stroke drawn in page points into a draw element (bounding box + normalized points). */
export function strokeToElement(pts: [number, number][], color: string, strokeWidth: number, pageId: string): EditorElement {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const pad = strokeWidth / 2 + 2;
  const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
  const w = Math.max(...xs) - Math.min(...xs) + pad * 2, h = Math.max(...ys) - Math.min(...ys) + pad * 2;
  return { id: newId(), type: 'draw', pageId, x, y, w, h, color, strokeWidth, points: pts.map(([px, py]) => [(px - x) / w, (py - y) / h]) };
}

/**
 * Builds the downloaded file: pages in working order (deleted ones skipped, blanks added),
 * then every element drawn on its page.
 */
export async function exportPdf(bytes: ArrayBuffer, elements: EditorElement[], pages: PageEntry[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const doc = await PDFDocument.create();
  const kept = pages.filter(p => !p.deleted);
  const fromSrc = kept.filter(p => p.source !== null).map(p => p.source as number);
  const copied = await doc.copyPages(src, fromSrc);
  const byId = new Map<string, ReturnType<typeof doc.addPage>>();
  let ci = 0;
  for (const entry of kept) {
    const page = entry.source === null ? doc.addPage([entry.w, entry.h]) : doc.addPage(copied[ci++]);
    byId.set(entry.id, page);
  }

  const fonts = {
    '': await doc.embedFont(StandardFonts.Helvetica),
    b: await doc.embedFont(StandardFonts.HelveticaBold),
    i: await doc.embedFont(StandardFonts.HelveticaOblique),
    bi: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
  };
  for (const el of elements) {
    const page = byId.get(el.pageId);
    if (!page) continue;
    const ph = page.getHeight();
    if (el.type === 'mask' || el.type === 'highlight') {
      page.drawRectangle({ x: el.x, y: ph - el.y - el.h, width: el.w, height: el.h, color: hexToRgb(el.color), opacity: el.type === 'highlight' ? HIGHLIGHT_OPACITY : 1 });
    } else if (el.type === 'draw') {
      const pts = (el.points || []).map(([nx, ny]) => ({ x: el.x + nx * el.w, y: ph - (el.y + ny * el.h) }));
      const thickness = el.strokeWidth || 2, color = hexToRgb(el.color);
      if (pts.length === 1) page.drawCircle({ x: pts[0].x, y: pts[0].y, size: thickness / 2, color });
      for (let i = 1; i < pts.length; i++) page.drawLine({ start: pts[i - 1], end: pts[i], thickness, color, lineCap: LineCapStyle.Round });
    } else if (el.type === 'text') {
      const size = el.fontSize || 16;
      const font = fonts[`${el.bold ? 'b' : ''}${el.italic ? 'i' : ''}` as keyof typeof fonts];
      const lines = (el.text || '').split('\n');
      lines.forEach((raw, i) => {
        // Helvetica only encodes WinAnsi; drop anything it can't draw
        const line = [...raw].filter((c) => { try { font.encodeText(c); return true; } catch { return false; } }).join('');
        if (!line) return;
        const top = el.y + i * size * TEXT_LINE_HEIGHT + (size * (TEXT_LINE_HEIGHT - 1)) / 2;
        const baseY = ph - top - size * 0.8;
        page.drawText(line, { x: el.x + 4, y: baseY, size, font, color: hexToRgb(el.color) });
        if (el.underline) {
          const uy = baseY - size * 0.12;
          page.drawLine({ start: { x: el.x + 4, y: uy }, end: { x: el.x + 4 + font.widthOfTextAtSize(line, size), y: uy }, thickness: Math.max(0.5, size / 16), color: hexToRgb(el.color) });
        }
      });
    } else if (el.src) {
      const img = el.src.startsWith('data:image/jp') ? await doc.embedJpg(el.src) : await doc.embedPng(el.src);
      const ratio = img.width / img.height;
      let w = el.w, h = el.w / ratio;
      if (h > el.h) { h = el.h; w = el.h * ratio; }
      page.drawImage(img, { x: el.x + (el.w - w) / 2, y: ph - el.y - (el.h - h) / 2 - h, width: w, height: h });
    }
  }
  return doc.save();
}

/** Password-protects finished PDF bytes (RC4 128-bit, opens in standard readers). */
export async function protectPdf(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  const { encryptPDF } = await import('@pdfsmaller/pdf-encrypt-lite');
  return encryptPDF(bytes, password);
}
