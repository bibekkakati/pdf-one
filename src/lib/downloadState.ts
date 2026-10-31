export const INITIAL_PDF_SCALE = 1;

export const hasUndownloadedEdits = (currentSnapshot: string, downloadedSnapshot: string) =>
  currentSnapshot !== downloadedSnapshot;