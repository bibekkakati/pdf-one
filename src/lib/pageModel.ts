import { EncryptedPDFError, PDFDocument } from 'pdf-lib';

// pdf-lib's transpiled Error subclass does not preserve instanceof in all runtimes.
export const isPasswordProtectedError = (error: unknown): boolean =>
  error instanceof Error && error.message === new EncryptedPDFError().message;

/** One page in the working document. `source` is the 0-based page index in the original file, or null for an inserted blank page. */
export interface PageEntry {
  id: string;
  source: number | null;
  w: number;        // displayed size in PDF points
  h: number;
  deleted: boolean;
}

const pid = () => 'p' + Math.random().toString(36).slice(2, 10);

export async function readPages(bytes: ArrayBuffer): Promise<PageEntry[]> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((p, i) => {
    const { width, height } = p.getSize();
    const baseRotation = ((p.getRotation().angle % 360) + 360) % 360;
    const swap = baseRotation === 90 || baseRotation === 270;
    return { id: pid(), source: i, w: swap ? height : width, h: swap ? width : height, deleted: false };
  });
}

export const blankPage = (w: number, h: number): PageEntry => ({ id: pid(), source: null, w, h, deleted: false });

/**
 * Parses page lists like "2, 5-7" into sorted unique 1-based numbers.
 * Returns null when any part is malformed or out of 1..max.
 */
export function parsePageRanges(input: string, max: number): number[] | null {
  const out = new Set<number>();
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  if (!parts.length) return [];
  for (const part of parts) {
    const m = part.match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if (!m) return null;
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < a || b > max) return null;
    for (let n = a; n <= b; n++) out.add(n);
  }
  return [...out].sort((x, y) => x - y);
}

/** Formats sorted page numbers back into a compact range string. */
export function formatPageRanges(nums: number[]): string {
  const s = [...nums].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    out.push(i === j ? `${s[i]}` : `${s[i]}-${s[j]}`);
    i = j;
  }
  return out.join(', ');
}

export const MIN_PASSWORD_LENGTH = 4;
