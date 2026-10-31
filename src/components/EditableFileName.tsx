import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MAX_FILE_NAME_LENGTH, pdfBaseName, renamePdf, validateFileName } from '@/lib/fileName';

const EditableFileName = ({ name, onRename }: { name: string; onRename: (name: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const error = editing ? validateFileName(draft) : null;

  const commit = () => {
    // Invalid names on blur revert to the previous name.
    onRename(renamePdf(draft, name));
    setEditing(false);
  };

  return editing ? (
    <div className="relative flex items-center gap-1 min-w-0 max-w-[320px]">
      <Input autoFocus aria-label="File name" aria-invalid={!!error} value={draft} maxLength={MAX_FILE_NAME_LENGTH + 4}
        className={`h-7 min-w-0 text-sm px-1 rounded-none border-0 border-b-2 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 ${error ? 'border-destructive' : 'border-primary'}`}
        onFocus={event => event.currentTarget.select()}
        onChange={event => setDraft(event.target.value)} onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') { event.preventDefault(); if (!error) commit(); }
          if (event.key === 'Escape') { event.preventDefault(); setEditing(false); }
        }} />
      <span className="text-sm text-muted-foreground shrink-0">.pdf</span>
      {error && (
        <p role="alert" className="absolute left-1 top-full mt-1 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-destructive shadow-md z-50">
          {error}
        </p>
      )}
    </div>
  ) : (
    <Button variant="ghost" size="sm" className="min-w-0 max-w-[320px] px-2 font-medium justify-start select-none hover:bg-muted/60"
      title="Rename file" aria-label={`Rename ${name}`}
      onClick={() => { setDraft(pdfBaseName(name)); setEditing(true); }}>
      <span className="truncate">{name}</span>
    </Button>
  );
};

export default EditableFileName;
