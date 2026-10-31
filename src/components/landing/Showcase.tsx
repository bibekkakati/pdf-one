import type React from 'react';
import { Lock, Check } from 'lucide-react';
import { useReveal } from './useReveal';

const Line = ({ w }: { w: string }) => <div className={`h-2 rounded bg-muted ${w}`} />;

const Panel = ({ children, title, text }: { children: React.ReactNode; title: string; text: string }) => {
  const { ref, className } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`flex flex-col rounded-2xl border bg-secondary/50 p-6 transition-all ${className}`}>
      <div className="grid h-48 place-items-center overflow-hidden rounded-xl bg-background">{children}</div>
      <h3 className="mt-6 text-xl font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
};

const MiniPage = ({ label, className = '' }: { label: string; className?: string }) => (
  <div className={`flex h-24 w-16 flex-col gap-1.5 rounded-md border bg-background p-2 shadow-sm ${className}`}>
    <Line w="w-full" /><Line w="w-3/4" /><Line w="w-full" />
    <span className="mt-auto text-center text-[10px] text-muted-foreground">{label}</span>
  </div>
);

export const MarkupDemo = () => (
  <Panel title="Mark up like on paper" text="Highlight key lines and draw arrows, circles or quick notes. Every stroke stays editable until you download.">
    <div className="relative w-56 space-y-3 p-4">
      <Line w="w-full" />
      <div className="relative">
        <div className="absolute -inset-y-1 left-0 rounded-sm bg-highlight-yellow/70 animate-highlight-sweep" />
        <div className="relative h-2 w-4/5 rounded bg-foreground/30" />
      </div>
      <Line w="w-11/12" /><Line w="w-2/3" />
      <svg viewBox="0 0 200 40" className="h-10 w-full text-brand">
        <path d="M5 30 C 40 5, 60 35, 95 18 S 150 10, 190 25" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
          pathLength={1} className="animate-draw-stroke" style={{ strokeDasharray: 1 }} />
      </svg>
    </div>
  </Panel>
);

export const PagesDemo = () => (
  <Panel title="Organize pages" text="Insert blank pages, reorder them or remove the ones you don’t need. Page changes are applied when you download.">
    <div className="flex items-center gap-3">
      <MiniPage label="1" />
      <MiniPage label="2" className="animate-tile-swap-right" />
      <MiniPage label="3" className="animate-tile-swap-left" />
      <MiniPage label="4" className="animate-tile-fade border-destructive/40" />
    </div>
  </Panel>
);

export const ProtectDemo = () => (
  <Panel title="Protect with a password" text="Add a password before you download, and the PDF will ask for it whenever someone opens it.">
    <div className="w-52 rounded-xl border p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium"><Lock className="h-4 w-4" /> Protect PDF</div>
      <div className="mt-3 flex h-8 items-center gap-1 rounded-md border px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-foreground animate-dot-in" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 text-brand" /> Applied on download</div>
    </div>
  </Panel>
);

export const LaserDemo = () => (
  <Panel title="Laser pointer for calls" text="Sharing your screen? Turn on the red laser pointer to show people exactly where to look. It never touches your file.">
    <div className="relative h-36 w-52 space-y-2.5 rounded-md border p-4">
      <Line w="w-full" /><Line w="w-5/6" /><Line w="w-full" /><Line w="w-2/3" /><Line w="w-3/4" />
      <span className="absolute left-0 top-0 h-3 w-3 rounded-full bg-laser shadow-[0_0_12px_4px_hsl(var(--laser)/0.6)] animate-laser-move" />
    </div>
  </Panel>
);
