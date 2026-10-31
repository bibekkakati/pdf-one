const ColorSwatches = ({ colors, value, onChange }: { colors: string[]; value?: string; onChange: (c: string) => void }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {colors.map(c => (
      <button key={c} onClick={() => onChange(c)} aria-label={`Color ${c}`}
        className={`w-5 h-5 rounded-full border ${value === c ? 'ring-2 ring-primary ring-offset-1' : ''}`} style={{ background: c }} />
    ))}
    <label className="relative w-5 h-5 rounded-full border overflow-hidden cursor-pointer" title="Custom color"
      style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}>
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
    </label>
  </div>
);

export default ColorSwatches;
