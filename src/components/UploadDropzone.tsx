import React from 'react';
import { LucideImage } from 'lucide-react';

interface Props {
  onFile: (file?: File) => void;
  label: string;
  accept?: string;
  icon?: React.ReactNode;
}

// Shared dashed upload box used by the Image tool and the signature Upload section
const UploadDropzone = ({ onFile, label, accept = 'image/*', icon }: Props) => (
  <label className="block w-full border-2 border-dashed rounded-lg px-3 py-5 text-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
    <input type="file" accept={accept} className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
    {icon ?? <LucideImage className="w-5 h-5 mx-auto mb-1.5" />}
    {label}
  </label>
);

export default UploadDropzone;
