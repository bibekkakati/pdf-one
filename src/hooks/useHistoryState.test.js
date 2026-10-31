import { describe, expect, test } from 'bun:test';
import { pushHistory, undoHistory, redoHistory } from './useHistoryState';

// Replays changes like the hook does, tracking the last mergeKey/time
function run(changes) {
  let h = { past: [], value: 0, future: [] };
  let last = { at: 0 };
  for (const [value, opts, at] of changes) {
    h = pushHistory(h, value, last, opts, at);
    last = { key: opts?.mergeKey, at };
  }
  return h;
}

describe('undo history steps', () => {
  test('adding then immediately dragging gives separate steps', () => {
    const drag = { mergeKey: 'gesture:1', mergeMs: Infinity };
    const h = run([[1, undefined, 1000], [2, drag, 1100], [3, drag, 1200]]);
    expect(h.past).toEqual([0, 1]);
    expect(undoHistory(h).value).toBe(1);
  });

  test('a drag with a long pause stays one step', () => {
    const drag = { mergeKey: 'gesture:1', mergeMs: Infinity };
    const h = run([[1, undefined, 0], [2, drag, 1000], [3, drag, 5000]]);
    expect(h.past).toEqual([0, 1]);
  });

  test('separate drags are separate steps even when quick', () => {
    const h = run([[1, { mergeKey: 'gesture:1', mergeMs: Infinity }, 0], [2, { mergeKey: 'gesture:2', mergeMs: Infinity }, 50]]);
    expect(h.past).toEqual([0, 1]);
  });

  test('two quick discrete adds are two steps', () => {
    const h = run([[1, undefined, 1000], [2, undefined, 1050]]);
    expect(h.past).toEqual([0, 1]);
  });

  test('typing merges in bursts per element', () => {
    const a = { mergeKey: 'text:a' };
    const h = run([[1, a, 0], [2, a, 200], [3, a, 400], [4, a, 2000], [5, { mergeKey: 'text:b' }, 2100]]);
    expect(h.past).toEqual([0, 3, 4]);
  });

  test('a new edit after undo clears redo', () => {
    let h = run([[1, undefined, 0], [2, undefined, 1000]]);
    h = undoHistory(h);
    expect(h.future).toEqual([2]);
    expect(redoHistory(h).value).toBe(2);
    h = pushHistory(h, 9, { at: 0 });
    expect(h.future).toEqual([]);
    expect(redoHistory(h)).toBeNull();
  });

  test('undo with no history returns null', () => {
    expect(undoHistory({ past: [], value: 0, future: [] })).toBeNull();
  });

  test('history keeps at most the limit of past steps', () => {
    let h = { past: [], value: 0, future: [] };
    for (let i = 1; i <= 5; i++) h = pushHistory(h, i, { at: 0 }, undefined, 0, 3);
    expect(h.past).toEqual([2, 3, 4]);
  });
});

