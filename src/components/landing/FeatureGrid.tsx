import { PenLine, Type, Highlighter, Pencil, Square, Image as ImageIcon, Files, Lock } from 'lucide-react';
import { useReveal } from './useReveal';

const groups = [
  {
    name: 'Sign & fill',
    items: [
      { icon: PenLine, title: 'Sign', text: 'Sign PDFs online — type, draw or upload your signature.' },
      { icon: Type, title: 'Text', text: 'Add text to any PDF with full font styling.' },
    ],
  },
  {
    name: 'Mark up',
    items: [
      { icon: Highlighter, title: 'Highlight', text: 'Highlight PDF text in soft translucent colour.' },
      { icon: Pencil, title: 'Draw', text: 'Draw freehand with adjustable colour and stroke.' },
      { icon: Square, title: 'Box', text: 'Hide sensitive details with solid colour boxes.' },
      { icon: ImageIcon, title: 'Image', text: 'Insert, crop and place images anywhere.' },
    ],
  },
  {
    name: 'Pages & security',
    items: [
      { icon: Files, title: 'Pages', text: 'Insert, reorder or delete PDF pages.' },
      { icon: Lock, title: 'Protect', text: 'Password-protect your PDF on download.' },
    ],
  },
];

const FeatureGrid = () => {
  const { ref, className } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`mt-16 grid gap-8 transition-all lg:grid-cols-[1fr_2fr_1fr] ${className}`}>
      {groups.map(g => (
        <div key={g.name} className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.name}</p>
          <div className={`mt-4 grid flex-1 gap-3 ${g.items.length > 2 ? 'sm:grid-cols-2' : ''}`}>
            {g.items.map(({ icon: Icon, title, text }) => (
              <div key={title} className="h-full rounded-xl border bg-background p-5 transition-shadow hover:shadow-paper">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-muted text-foreground"><Icon className="h-4 w-4" /></span>
                <h3 className="mt-4 font-medium">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeatureGrid;
