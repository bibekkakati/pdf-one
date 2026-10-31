import { useEffect, useRef, useState } from 'react';
import { Document } from 'react-pdf';
import { ArrowLeft, ArrowRight, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageSurface from '@/components/viewer/PageSurface';
import { PageEntry, parsePageRanges, formatPageRanges, MIN_PASSWORD_LENGTH } from '@/lib/pageModel';

const TILE_W = 96;

/** Lazy page thumbnail used inside dialogs. */
const Tile = ({ entry }: { entry: PageEntry }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: '200px' });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const size = { w: entry.w, h: entry.h };
  const s = Math.min(TILE_W / size.w, (TILE_W * 1.3) / size.h);
  return (
    <div ref={ref} className="grid place-items-center" style={{ width: TILE_W, height: TILE_W * 1.3 }}>
      <div className="border bg-background shadow-sm overflow-hidden" style={{ width: size.w * s, height: size.h * s }}>
        {visible && <PageSurface entry={entry} scale={s} />}
      </div>
    </div>
  );
};

interface DeleteProps { open: boolean; onOpenChange: (o: boolean) => void; file: string; pages: PageEntry[]; onApply: (deletedIds: Set<string>) => void }

export const DeletePagesDialog = ({ open, onOpenChange, file, pages, onApply }: DeleteProps) => {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) return;
    const init = new Set(pages.flatMap((p, i) => p.deleted ? [i + 1] : []));
    setSelected(init); setInput(formatPageRanges([...init])); setError('');
  }, [open, pages]);

  const toggle = (n: number) => {
    const next = new Set(selected);
    if (next.has(n)) next.delete(n); else next.add(n);
    setSelected(next); setInput(formatPageRanges([...next])); setError('');
  };
  const onInput = (v: string) => {
    setInput(v);
    const parsed = parsePageRanges(v, pages.length);
    if (!parsed) { setError(`Use page numbers from 1 to ${pages.length}, like 2, 5-7`); return; }
    setError(''); setSelected(new Set(parsed));
  };
  const all = selected.size >= pages.length;
  const apply = () => {
    if (error || all) return;
    onApply(new Set(pages.filter((_, i) => selected.has(i + 1)).map(p => p.id)));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Delete pages</DialogTitle>
          <DialogDescription>Click pages or type their numbers. They're only removed from the file when you download it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="delete-pages-input" className="text-xs">Pages to delete</Label>
          <Input id="delete-pages-input" value={input} onChange={e => onInput(e.target.value)} placeholder="e.g. 2, 5-7" className="h-9" aria-invalid={!!error} />
          {error ? <p className="text-xs text-destructive">{error}</p> : all ? <p className="text-xs text-destructive">At least one page has to stay in the file.</p> : null}
        </div>
        <Document file={file} className="max-h-[50vh] overflow-y-auto grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3 p-1">
          {pages.map((p, i) => {
            const on = selected.has(i + 1);
            return (
              <button key={p.id} onClick={() => toggle(i + 1)} aria-pressed={on} aria-label={`Page ${i + 1}`}
                className={`relative flex flex-col items-center gap-1 rounded-md p-1.5 transition-colors ${on ? 'bg-destructive/10' : 'hover:bg-muted'}`}>
                <div className={on ? 'opacity-40' : ''}><Tile entry={p} /></div>
                <span className={`text-xs ${on ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{i + 1}</span>
              </button>
            );
          })}
        </Document>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!!error || all} onClick={apply}>
            {selected.size ? `Mark ${selected.size} page${selected.size > 1 ? 's' : ''} for deletion` : 'Keep all pages'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface OrganizeProps { open: boolean; onOpenChange: (o: boolean) => void; file: string; pages: PageEntry[]; onApply: (pages: PageEntry[]) => void }

export const OrganizePagesDialog = ({ open, onOpenChange, file, pages, onApply }: OrganizeProps) => {
  const [order, setOrder] = useState<PageEntry[]>(pages);
  const [dragId, setDragId] = useState<string | null>(null);
  useEffect(() => { if (open) setOrder(pages); }, [open, pages]);

  const moveTo = (from: string, to: string) => setOrder(o => {
    const a = o.findIndex(p => p.id === from), b = o.findIndex(p => p.id === to);
    if (a < 0 || b < 0 || a === b) return o;
    const next = [...o]; const [item] = next.splice(a, 1); next.splice(b, 0, item); return next;
  });
  const shift = (id: string, by: number) => setOrder(o => {
    const a = o.findIndex(p => p.id === id), b = a + by;
    if (b < 0 || b >= o.length) return o;
    const next = [...o]; [next[a], next[b]] = [next[b], next[a]]; return next;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Reorder pages</DialogTitle>
          <DialogDescription>Drag pages or use the arrow buttons to change their order. Your edits stay on their page.</DialogDescription>
        </DialogHeader>
        <Document file={file} className="max-h-[55vh] overflow-y-auto grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 p-1">
          {order.map((p, i) => (
            <div key={p.id} draggable onDragStart={() => setDragId(p.id)} onDragEnd={() => setDragId(null)}
              onDragOver={e => { e.preventDefault(); if (dragId) moveTo(dragId, p.id); }}
              data-testid="organize-tile"
              className={`group flex flex-col items-center gap-1 rounded-md p-1.5 cursor-grab active:cursor-grabbing ${dragId === p.id ? 'opacity-50' : ''} ${p.deleted ? 'opacity-50' : ''}`}>
              <Tile entry={p} />
              <div className="relative flex items-center justify-center h-4">
                <span className="text-xs leading-4 text-muted-foreground">{i + 1}</span>
                <GripVertical className="absolute -left-5 w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <div className="flex gap-1">
                <button className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent" disabled={i === 0} onClick={() => shift(p.id, -1)} aria-label={`Move page ${i + 1} earlier`} title="Move earlier"><ArrowLeft className="w-4 h-4" /></button>
                <button className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent" disabled={i === order.length - 1} onClick={() => shift(p.id, 1)} aria-label={`Move page ${i + 1} later`} title="Move later"><ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </Document>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onApply(order); onOpenChange(false); }}>Apply changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ProtectProps { open: boolean; onOpenChange: (o: boolean) => void; hasPassword: boolean; onApply: (password: string | null) => void }

export const ProtectDialog = ({ open, onOpenChange, hasPassword, onApply }: ProtectProps) => {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (open) { setPw(''); setConfirm(''); setTouched(false); setShow(false); } }, [open]);
  const error = pw.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : pw !== confirm ? "Passwords don't match." : '';
  const submit = () => { setTouched(true); if (error) return; onApply(pw); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Protect with a password</DialogTitle>
          <DialogDescription>Password is checked on your device and never sent outside.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); submit(); }}>
          <div className="space-y-1.5">
            <Label htmlFor="pdf-password" className="text-xs">Password</Label>
            <div className="relative">
              <Input id="pdf-password" type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} className="h-9 pr-9" autoFocus autoComplete="new-password" />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pdf-password-confirm" className="text-xs">Confirm password</Label>
            <Input id="pdf-password-confirm" type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} className="h-9" autoComplete="new-password" />
          </div>
          {touched && error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter className="flex-wrap gap-2 sm:gap-2 sm:space-x-0">
            {hasPassword && <Button type="button" variant="ghost" className="text-destructive hover:text-destructive sm:mr-auto" onClick={() => { onApply(null); onOpenChange(false); }}>Remove protection</Button>}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Set password</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface UnlockProps { open: boolean; fileName: string; onUnlock: (password: string) => Promise<string | null>; onCancel: () => void }

/** Asks for the password of an encrypted PDF. `onUnlock` resolves to an error message, or null on success. */
export const UnlockDialog = ({ open, fileName, onUnlock, onCancel }: UnlockProps) => {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setPw(''); setError(''); setShow(false); setBusy(false); } }, [open]);
  const submit = async () => {
    if (!pw) { setError('Enter the password.'); return; }
    setBusy(true);
    const err = await onUnlock(pw);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>This PDF is password-protected</DialogTitle>
          <DialogDescription>Enter the password to open “{fileName}”. It's checked on your device and never sent anywhere.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); submit(); }}>
          <div className="space-y-1.5">
            <Label htmlFor="pdf-unlock" className="text-xs">Password</Label>
            <div className="relative">
              <Input id="pdf-unlock" type={show ? 'text' : 'password'} value={pw} onChange={e => { setPw(e.target.value); setError(''); }} className="h-9 pr-9" autoFocus autoComplete="current-password" />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Unlocking…' : 'Unlock'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
