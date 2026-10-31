import { describe, expect, test } from 'bun:test';
import { hasUndownloadedEdits, INITIAL_PDF_SCALE } from './downloadState';

describe('PDF viewing and undownloaded edits', () => {
  test('PDFs open at 100%', () => {
    expect(INITIAL_PDF_SCALE).toBe(1);
  });
  test('unchanged files do not warn', () => {
    expect(hasUndownloadedEdits('[]', '[]')).toBe(false);
  });
  test('new edits require confirmation', () => {
    expect(hasUndownloadedEdits('[{"id":"box"}]', '[]')).toBe(true);
  });
  test('downloading the current edits clears confirmation', () => {
    expect(hasUndownloadedEdits('[{"id":"box"}]', '[{"id":"box"}]')).toBe(false);
  });
  test('edits made during or after download still require confirmation', () => {
    expect(hasUndownloadedEdits('[{"id":"box","x":20}]', '[{"id":"box","x":10}]')).toBe(true);
  });
  test('removing previously downloaded additions requires confirmation', () => {
    expect(hasUndownloadedEdits('[]', '[{"id":"box"}]')).toBe(true);
  });
});