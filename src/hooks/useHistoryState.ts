import { useRef, useState } from 'react';

type Updater<T> = T | ((prev: T) => T);

/** State with undo/redo. Changes within `mergeMs` (drag, typing) collapse into one undo step. */
export function useHistoryState<T>(initial: T, { limit = 100, mergeMs = 500 } = {}) {
  const [value, setValue] = useState(initial);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const valueRef = useRef(value);
  valueRef.current = value;
  const lastPush = useRef(0);

  const set = (next: Updater<T>) => {
    const now = Date.now();
    if (now - lastPush.current > mergeMs) setPast(p => [...p.slice(-(limit - 1)), valueRef.current]);
    lastPush.current = now;
    setFuture([]);
    setValue(next);
  };

  const undo = () => {
    if (!past.length) return false;
    setFuture(f => [value, ...f]); setValue(past[past.length - 1]); setPast(p => p.slice(0, -1));
    lastPush.current = 0;
    return true;
  };

  const redo = () => {
    if (!future.length) return false;
    setPast(p => [...p, value]); setValue(future[0]); setFuture(f => f.slice(1));
    lastPush.current = 0;
    return true;
  };

  const reset = (next: T) => { setValue(next); setPast([]); setFuture([]); lastPush.current = 0; };

  return { value, set, undo, redo, reset, canUndo: past.length > 0, canRedo: future.length > 0 };
}
