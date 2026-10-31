// Hands the working PDF from the landing page to the workspace. An in-memory copy makes the
// hand-off instant; IndexedDB keeps it for refreshes (sessionStorage's ~5 MB is far too small).
export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const tooLargeMessage = 'This PDF is larger than 50 MB. Please choose a smaller file.';

const DB = 'pdf-one', STORE = 'files', KEY = 'working';
let memory: File | null = null;

const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const req = indexedDB.open(DB, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const run = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).finally(() => db.close());
};

export const saveWorkingPdf = (file: File) => {
  memory = file;
  return run('readwrite', s => s.put(file, KEY));
};

export const loadWorkingPdf = async (): Promise<File | null> => {
  if (memory) return memory;
  const v = await run<File | undefined>('readonly', s => s.get(KEY) as IDBRequest<File | undefined>);
  return v instanceof Blob ? new File([v], (v as File).name || 'document.pdf', { type: 'application/pdf' }) : null;
};
