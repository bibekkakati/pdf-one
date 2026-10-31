import { TEXT_LINE_HEIGHT } from '@/lib/editorElements';

export const loadImageSize = (src: string) => new Promise<{ w: number; h: number }>((resolve) => {
  const img = new Image();
  img.onload = () => resolve({ w: img.width, h: img.height });
  img.src = src;
});

let measureCtx: CanvasRenderingContext2D | null = null;

/** Box size (PDF points) needed to fit the text; one shared canvas avoids allocating per keystroke. */
export const measureText = (text: string, size: number, bold = false, italic = false) => {
  measureCtx ??= document.createElement('canvas').getContext('2d')!;
  measureCtx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px Helvetica, Arial, sans-serif`;
  const lines = (text || ' ').split('\n');
  const w = Math.max(...lines.map(l => measureCtx!.measureText(l || ' ').width));
  return { w: Math.ceil(w) + 10, h: lines.length * size * TEXT_LINE_HEIGHT };
};
