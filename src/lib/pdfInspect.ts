import { pdfjs } from 'react-pdf';
import { readPages, type PageEntry } from '@/lib/pageModel';

if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
}

const ENCRYPT = new TextEncoder().encode('/Encrypt');

/** Fast byte scan for an /Encrypt entry (covers PDFs with an empty user password that PDF.js opens silently). */
function hasEncryptEntry(bytes: Uint8Array): boolean {
  const first = ENCRYPT[0];
  outer: for (let i = bytes.indexOf(first); i !== -1 && i <= bytes.length - ENCRYPT.length; i = bytes.indexOf(first, i + 1)) {
    for (let j = 1; j < ENCRYPT.length; j++) if (bytes[i + j] !== ENCRYPT[j]) continue outer;
    return true;
  }
  return false;
}

const pid = () => 'p' + Math.random().toString(36).slice(2, 10);

/**
 * Reads page sizes in the PDF.js worker so the main thread stays free.
 * Encrypted files go through strict pdf-lib readPages, which throws EncryptedPDFError.
 */
export async function inspectPages(bytes: ArrayBuffer): Promise<PageEntry[]> {
  const view = new Uint8Array(bytes);
  if (hasEncryptEntry(view)) return readPages(bytes);
  const doc = await pdfjs.getDocument({ data: view.slice() }).promise;
  try {
    const out: PageEntry[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 1 }); // already accounts for /Rotate
      out.push({ id: pid(), source: i - 1, w: vp.width, h: vp.height, deleted: false });
      page.cleanup();
    }
    return out;
  } finally {
    doc.destroy();
  }
}
