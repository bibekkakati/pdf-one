import { useRef, useState } from 'react';

type Updater<T> = T | ((prev: T) => T);

export type History<T> = { past: T[]; value: T; future: T[] };
/** `mergeKey` lets related changes (one drag, a typing burst) share an undo step; omit it for discrete actions. */
export type SetOptions = { mergeKey?: string; mergeMs?: number };
type LastChange = { key?: string; at: number };

const DEFAULT_MERGE_MS = 500;

/** Applies a change; merges into the previous step only when it has the same mergeKey within mergeMs. */
export function pushHistory<T>(h: History<T>, next: T, last: LastChange, opts: SetOptions = {}, now = Date.now(), limit = 100): History<T> {
  const { mergeKey, mergeMs = DEFAULT_MERGE_MS } = opts;
  const merge = mergeKey !== undefined && last.key === mergeKey && now - last.at <= mergeMs && h.past.length > 0;
  return { past: merge ? h.past : [...h.past.slice(-(limit - 1)), h.value], value: next, future: [] };
}

export function undoHistory<T>(h: History<T>): History<T> | null {
  if (!h.past.length) return null;
  return { past: h.past.slice(0, -1), value: h.past[h.past.length - 1], future: [h.value, ...h.future] };
}

export function redoHistory<T>(h: History<T>): History<T> | null {
  if (!h.future.length) return null;
  return { past: [...h.past, h.value], value: h.future[0], future: h.future.slice(1) };
}

/** State with undo/redo. Changes are separate steps unless they share a `mergeKey` (see SetOptions). */
export function useHistoryState<T>(initial: T, { limit = 100 } = {}) {
  const [state, setState] = useState<History<T>>({ past: [], value: initial, future: [] });
  // Ref mirrors the latest state so consecutive calls before a re-render still chain correctly
  const ref = useRef(state);
  const last = useRef<LastChange>({ at: 0 });

  const commit = (h: History<T>) => { ref.current = h; setState(h); };

  const set = (next: Updater<T>, opts: SetOptions = {}) => {
    const h = ref.current;
    const value = typeof next === 'function' ? (next as (prev: T) => T)(h.value) : next;
    if (Object.is(value, h.value)) return;
    const now = Date.now();
    commit(pushHistory(h, value, last.current, opts, now, limit));
    last.current = { key: opts.mergeKey, at: now };
  };

  const step = (fn: (h: History<T>) => History<T> | null) => {
    const h = fn(ref.current);
    if (!h) return null;
    commit(h);
    last.current = { at: 0 };
    return h.value;
  };
  const undo = () => step(undoHistory);
  const redo = () => step(redoHistory);

  const reset = (next: T) => { commit({ past: [], value: next, future: [] }); last.current = { at: 0 }; };

  return { value: state.value, set, undo, redo, reset, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
