import { describe, expect, test } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import { parsePageRanges, formatPageRanges, readPages, blankPage, isPasswordProtectedError } from './pageModel';
import { exportPdf, protectPdf } from './editorElements';

const makePdf = async () => {
  const d = await PDFDocument.create();
  d.addPage([100, 200]); d.addPage([300, 400]); d.addPage([500, 600]);
  return (await d.save()).buffer;
};

describe('page selection input', () => {
  test('parses lists and ranges', () => expect(parsePageRanges('2, 5-7', 10)).toEqual([2, 5, 6, 7]));
  test('rejects pages beyond the document', () => expect(parsePageRanges('3-12', 10)).toBeNull());
  test('rejects garbage', () => expect(parsePageRanges('two', 10)).toBeNull());
  test('formats back into ranges', () => expect(formatPageRanges([7, 1, 2, 3, 5])).toBe('1-3, 5, 7'));
});

describe('direct PDF loading', () => {
  test('opens an unprotected PDF without a password', async () => {
    expect((await readPages(await makePdf())).map(p => [p.w, p.h])).toEqual([[100, 200], [300, 400], [500, 600]]);
  });
  test('reports protection only when the direct load rejects encryption', async () => {
    const bytes = await protectPdf(new Uint8Array(await makePdf()), 'secret1');
    const error = await readPages(new Uint8Array(bytes).buffer).then(() => null, error => error);
    expect(isPasswordProtectedError(error)).toBe(true);
  });
  test('malformed files are not treated as password-protected', async () => {
    try {
      await readPages(new TextEncoder().encode('not a PDF').buffer);
      throw new Error('Invalid file unexpectedly loaded');
    } catch (error) {
      expect(isPasswordProtectedError(error)).toBe(false);
      expect(error.message).toContain('No PDF header found');
    }
  });
});

describe('download applies page changes', () => {
  test('deleted pages are removed, blanks inserted, order kept', async () => {
    const bytes = await makePdf();
    const pages = await readPages(bytes);
    const [a, b, c] = pages;
    const working = [c, blankPage(50, 50), a, { ...b, deleted: true }];
    const out = await PDFDocument.load(await exportPdf(bytes, [], working));
    const outPages = out.getPages();
    expect(outPages.length).toBe(3);
    expect(outPages.map(p => p.getWidth())).toEqual([500, 50, 100]);
  });
  test('protected download needs the password', async () => {
    const bytes = await exportPdf(await makePdf(), [], await readPages(await makePdf()));
    const locked = await protectPdf(bytes, 'secret1');
    expect(new TextDecoder('latin1').decode(locked)).toContain('/Encrypt');
  });
});
