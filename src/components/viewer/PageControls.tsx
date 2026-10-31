import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  currentPage: number;
  numPages: number;
  pageInput: string;
  scale: number;
  onPageInput: (value: string) => void;
  onCommitPageInput: () => void;
  onNavigate: (page: number) => void;
  onScale: (update: (s: number) => number) => void;
}

const iconBtn = 'h-8 w-8 rounded-full';

const PageControls = ({ currentPage, numPages, pageInput, scale, onPageInput, onCommitPageInput, onNavigate, onScale }: Props) => (
  <div className="sticky bottom-0 z-30 flex justify-center pb-3 pointer-events-none">
    <div className="pointer-events-auto flex items-center gap-1 rounded-full border bg-background/90 backdrop-blur-md shadow-lg px-2 py-1">
      <Button variant="ghost" size="icon" className={iconBtn} aria-label="Previous page" disabled={currentPage <= 1 || !numPages} onClick={() => onNavigate(currentPage - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Input type="number" aria-label="Page number" min={1} max={numPages || 1} step={1} value={pageInput} disabled={!numPages} className="h-8 w-14 text-center px-1"
        onChange={(event) => onPageInput(event.target.value)} onBlur={onCommitPageInput}
        onKeyDown={(event) => {
          if (event.key === 'Enter') { event.preventDefault(); onCommitPageInput(); }
          if (event.key === 'Escape') onPageInput(String(currentPage));
        }} />
      <span className="whitespace-nowrap text-sm text-muted-foreground px-1" aria-live="polite">of {numPages || '…'}</span>
      <Button variant="ghost" size="icon" className={iconBtn} aria-label="Next page" disabled={currentPage >= numPages || !numPages} onClick={() => onNavigate(currentPage + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-5 w-px bg-border" />
      <Button variant="ghost" size="icon" className={iconBtn} aria-label="Zoom out" onClick={() => onScale(s => Math.max(0.5, +(s - 0.1).toFixed(1)))}>
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-11 text-center text-sm text-muted-foreground">{Math.round(scale * 100)}%</span>
      <Button variant="ghost" size="icon" className={iconBtn} aria-label="Zoom in" onClick={() => onScale(s => Math.min(2, +(s + 0.1).toFixed(1)))}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default PageControls;
