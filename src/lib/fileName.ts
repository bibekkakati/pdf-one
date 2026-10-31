export const pdfBaseName = (name: string) => name.replace(/\.pdf$/i, '');

export const MAX_FILE_NAME_LENGTH = 200;
// eslint-disable-next-line no-control-regex -- control characters are deliberately rejected
const ILLEGAL_CHARS = /[/\\:*?"<>|\u0000-\u001f]/;
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** Returns an error message for an invalid name, or null when it is fine. */
export const validateFileName = (draft: string): string | null => {
  const base = pdfBaseName(draft.trim()).trim();
  if (!base) return 'Name can’t be empty';
  if (ILLEGAL_CHARS.test(base)) return 'Can’t use / \\ : * ? " < > |';
  if (base.length > MAX_FILE_NAME_LENGTH) return `Max ${MAX_FILE_NAME_LENGTH} characters`;
  if (RESERVED.test(base)) return 'This name is reserved';
  if (/^\.+$/.test(base) || /\.$/.test(base)) return 'Name can’t end with a dot';
  return null;
};

export const renamePdf = (draft: string, previousName: string) => {
  if (validateFileName(draft)) return previousName;
  return `${pdfBaseName(draft.trim()).trim()}.pdf`;
};
