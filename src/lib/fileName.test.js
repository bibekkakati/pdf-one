import { expect, test } from 'bun:test';
import { pdfBaseName, renamePdf, validateFileName } from './fileName';

test('only the name is editable, not the PDF extension', () => {
  expect(pdfBaseName('Annual report.PDF')).toBe('Annual report');
  expect(renamePdf('New report', 'Annual report.pdf')).toBe('New report.pdf');
});
test('pasting a PDF filename does not duplicate its fixed extension', () => {
  expect(renamePdf('New report.pdf', 'Old.pdf')).toBe('New report.pdf');
});
test('a different extension cannot replace the PDF extension', () => {
  expect(renamePdf('New report.txt', 'Old.pdf')).toBe('New report.txt.pdf');
});
test('an empty filename keeps the previous name', () => {
  expect(renamePdf('  ', 'Old.pdf')).toBe('Old.pdf');
});
test('names with illegal characters are rejected', () => {
  expect(validateFileName('a/b')).not.toBeNull();
  expect(renamePdf('bad:name', 'Old.pdf')).toBe('Old.pdf');
});
test('names over 200 characters are rejected', () => {
  expect(validateFileName('a'.repeat(200))).toBeNull();
  expect(validateFileName('a'.repeat(201))).not.toBeNull();
});
test('reserved and trailing-dot names are rejected', () => {
  expect(validateFileName('CON')).not.toBeNull();
  expect(validateFileName('report.')).not.toBeNull();
});