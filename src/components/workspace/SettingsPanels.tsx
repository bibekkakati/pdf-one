import { Bold, Italic, Underline, LucidePlus, LucideTrash2, LucidePenLine, LucideImage, LucideSquare, LucideType, Highlighter, Brush, Files, Lock, FilePlus2, LayoutGrid, Trash, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import ColorSwatches from '@/components/ColorSwatches';
import UploadDropzone from '@/components/UploadDropzone';
import ImageCropper from '@/components/ImageCropper';
import { EditorElement } from '@/lib/editorElements';

export const TOOLS = [
  { id: 'signature', label: 'Sign', icon: LucidePenLine },
  { id: 'text', label: 'Text', icon: LucideType },
  { id: 'highlight', label: 'Highlight', icon: Highlighter },
  { id: 'draw', label: 'Draw', icon: Brush },
  { id: 'mask', label: 'Box', icon: LucideSquare },
  { id: 'image', label: 'Image', icon: LucideImage },
] as const;
export const FILE_TOOLS = [
  { id: 'pages', label: 'Pages', icon: Files },
  { id: 'protect', label: 'Protect', icon: Lock },
] as const;
export const ALL_TOOLS = [...TOOLS, ...FILE_TOOLS];
export type ToolId = typeof ALL_TOOLS[number]['id'];

export const MASK_COLORS = ['#ffffff', '#000000', '#f3f4f6', '#fde047', '#ef4444', '#3b82f6'];
export const HIGHLIGHT_COLORS = ['#fff176', '#d9f99d', '#fbcfe8'];
export const DRAW_COLORS = ['#000000', '#1e3a8a', '#dc2626', '#16a34a', '#f59e0b'];
export const STROKE_WIDTHS = [{ label: 'Thin', value: 1.5 }, { label: 'Medium', value: 3 }, { label: 'Thick', value: 6 }];
const TEXT_COLORS = ['#000000', '#1e3a8a', '#dc2626', '#16a34a', '#6b7280'];

const StrokeWidthPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="grid grid-cols-3 gap-1">
    {STROKE_WIDTHS.map(s => (
      <Button key={s.value} size="sm" variant={value === s.value ? 'default' : 'outline'} className="h-8 flex-col gap-0.5 text-[10px]" aria-pressed={value === s.value} onClick={() => onChange(s.value)}>
        <span className="block w-6 rounded-full bg-current" style={{ height: Math.max(1, s.value * 0.7) }} />{s.label}
      </Button>
    ))}
  </div>
);

const FieldLabel = ({ children }: { children: string }) => (
  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{children}</p>
);
const Hint = ({ children }: { children: string }) => <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>;

interface ElementSettingsProps {
  element: EditorElement;
  onUpdate: (patch: Partial<EditorElement>) => void;
  onTextChange: (patch: Partial<EditorElement>) => void;
  onMaskColor: (color: string) => void;
  onRemove: () => void;
}

export const ElementSettings = ({ element: el, onUpdate, onTextChange, onMaskColor, onRemove }: ElementSettingsProps) => (
  <div className="p-3 space-y-5">
    {el.type === 'signature' && (
      <div className="border rounded-md p-2 grid place-items-center bg-background">
        <img src={el.src} alt="Signature" className="max-h-14 object-contain" />
      </div>
    )}
    {el.type === 'image' && el.original && (
      <ImageCropper source={el.original} onCropped={(src, w, h) => onUpdate({ src, h: el.w * (h / w) })} />
    )}
    {el.type === 'mask' && (
      <div className="space-y-2.5"><FieldLabel>Fill color</FieldLabel>
        <ColorSwatches colors={MASK_COLORS} value={el.color} onChange={c => { onUpdate({ color: c }); onMaskColor(c); }} />
      </div>
    )}
    {el.type === 'highlight' && (
      <div className="space-y-2.5"><FieldLabel>Highlight color</FieldLabel>
        <ColorSwatches colors={HIGHLIGHT_COLORS} value={el.color} onChange={c => onUpdate({ color: c })} />
      </div>
    )}
    {el.type === 'draw' && (<>
      <div className="space-y-2.5"><FieldLabel>Pen color</FieldLabel>
        <ColorSwatches colors={DRAW_COLORS} value={el.color} onChange={c => onUpdate({ color: c })} />
      </div>
      <div className="space-y-2.5"><FieldLabel>Stroke width</FieldLabel>
        <StrokeWidthPicker value={el.strokeWidth || 3} onChange={w => onUpdate({ strokeWidth: w })} />
      </div>
    </>)}
    {el.type === 'text' && (<>
      <div className="space-y-2.5">
        <FieldLabel>Text</FieldLabel>
        <Textarea className="min-h-0 text-xs px-2 py-1.5" value={el.text} rows={2} autoFocus onChange={e => onTextChange({ text: e.target.value })} placeholder="Type here" />
        <p className="text-xs text-muted-foreground">Press Enter to start a new line.</p>
      </div>
      <div className="space-y-2.5">
        <div className="flex justify-between"><FieldLabel>Font size</FieldLabel><span className="text-xs text-muted-foreground">{el.fontSize}px</span></div>
        <Slider min={6} max={72} step={1} value={[el.fontSize || 16]} onValueChange={v => onTextChange({ fontSize: v[0] })} />
      </div>
      <div className="space-y-2.5">
        <FieldLabel>Style</FieldLabel>
        <div className="flex gap-1">
          {([['bold', Bold], ['italic', Italic], ['underline', Underline]] as const).map(([k, I]) => (
            <Button key={k} size="icon" variant={el[k] ? 'default' : 'outline'} className="h-7 w-7" aria-label={k} aria-pressed={!!el[k]}
              onClick={() => onTextChange({ [k]: !el[k] })}><I className="w-3 h-3" /></Button>
          ))}
        </div>
      </div>
      <div className="space-y-2.5"><FieldLabel>Font color</FieldLabel><ColorSwatches colors={TEXT_COLORS} value={el.color} onChange={c => onUpdate({ color: c })} /></div>
    </>)}
    <Hint>
      {el.type === 'signature' || el.type === 'image'
        ? 'Drag on the page to move it, or drag the bottom-right dot to resize it — the proportions stay locked.'
        : 'Drag on the page to move it, or drag the bottom-right dot to resize it freely.'}
    </Hint>
    <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" onClick={onRemove}>
      <LucideTrash2 className="w-4 h-4 mr-1.5" /> Remove
    </Button>
  </div>
);

interface ToolSettingsProps {
  tool: Exclude<ToolId, 'signature'>;
  maskColor: string;
  onMaskColor: (color: string) => void;
  onImageFile: (file?: File) => void;
  onAddMask: () => void;
  onAddText: () => void;
  highlightColor: string;
  onHighlightColor: (c: string) => void;
  onAddHighlight: () => void;
  drawColor: string;
  onDrawColor: (c: string) => void;
  drawWidth: number;
  onDrawWidth: (w: number) => void;
  pageCount: number;
  deletedCount: number;
  onInsertBlank: () => void;
  onOpenDelete: () => void;
  onOpenOrganize: () => void;
  hasPassword: boolean;
  onOpenProtect: () => void;
}

export const ToolSettings = (p: ToolSettingsProps) => (
  <div className="p-3 space-y-5">
    {p.tool === 'image' && (<>
      <UploadDropzone onFile={p.onImageFile} label="Choose an image (PNG, JPG)" />
      <Hint>Adds the image to the current page. Select it there to crop, move or resize it.</Hint>
    </>)}
    {p.tool === 'mask' && (<>
      <div className="space-y-2.5"><FieldLabel>Fill color</FieldLabel><ColorSwatches colors={MASK_COLORS} value={p.maskColor} onChange={p.onMaskColor} /></div>
      <Button size="sm" className="w-full" onClick={p.onAddMask}><LucidePlus className="w-3.5 h-3.5 mr-1" /> Place box</Button>
      <Hint>Places the box on the current page — drag it over the content you want to hide. White blanks it out; black works as a redaction.</Hint>
    </>)}
    {p.tool === 'text' && (<>
      <Button size="sm" className="w-full" onClick={p.onAddText}><LucidePlus className="w-3.5 h-3.5 mr-1" /> Add text box</Button>
      <Hint>Adds an empty text box to the current page. With it selected, edit its content, size and color here.</Hint>
    </>)}
    {p.tool === 'highlight' && (<>
      <div className="space-y-2.5"><FieldLabel>Highlight color</FieldLabel><ColorSwatches colors={HIGHLIGHT_COLORS} value={p.highlightColor} onChange={p.onHighlightColor} /></div>
      <Button size="sm" className="w-full" onClick={p.onAddHighlight}><LucidePlus className="w-3.5 h-3.5 mr-1" /> Add highlight</Button>
      <Hint>Places a see-through marker on the current page. Drag it over the words you want to stand out and resize it to fit.</Hint>
    </>)}
    {p.tool === 'draw' && (<>
      <div className="space-y-2.5"><FieldLabel>Pen color</FieldLabel><ColorSwatches colors={DRAW_COLORS} value={p.drawColor} onChange={p.onDrawColor} /></div>
      <div className="space-y-2.5"><FieldLabel>Stroke width</FieldLabel><StrokeWidthPicker value={p.drawWidth} onChange={p.onDrawWidth} /></div>
      <Hint>Draw straight on the page with your mouse or finger. Each stroke can be selected afterwards to move, recolor or remove it.</Hint>
    </>)}
    {p.tool === 'pages' && (<>
      <p className="text-xs text-muted-foreground">{p.pageCount} page{p.pageCount === 1 ? '' : 's'}{p.deletedCount ? ` · ${p.deletedCount} marked for deletion` : ''}</p>
      <div className="space-y-2">
        <Button size="sm" variant="outline" className="w-full justify-start" onClick={p.onInsertBlank}><FilePlus2 className="w-3.5 h-3.5 mr-2" /> Insert page</Button>
        <Button size="sm" variant="outline" className="w-full justify-start" onClick={p.onOpenOrganize}><LayoutGrid className="w-3.5 h-3.5 mr-2" /> Reorder pages</Button>
        <Button size="sm" variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={p.onOpenDelete}><Trash className="w-3.5 h-3.5 mr-2" /> Delete pages</Button>
      </div>
      <Hint>Page changes are applied to the file when you download it.</Hint>
    </>)}
    {p.tool === 'protect' && (<>
      {p.hasPassword ? (
        <div className="flex items-start gap-2 rounded-md border bg-muted/50 p-2.5">
          <ShieldCheck className="w-4 h-4 mt-0.5 text-brand shrink-0" />
          <p className="text-xs">Password set — it's applied when you download.</p>
        </div>
      ) : null}
      <Button size="sm" className="w-full" onClick={p.onOpenProtect}><Lock className="w-3.5 h-3.5 mr-1.5" /> {p.hasPassword ? 'Change password' : 'Set password'}</Button>
      <Hint>Anyone opening the downloaded PDF will need this password. It stays on your device and is never sent anywhere.</Hint>
    </>)}
  </div>
);
