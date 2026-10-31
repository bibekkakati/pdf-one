
import React, { useRef, useState } from 'react';
import { trimCanvas } from '@/lib/trimCanvas';
import { Button } from '@/components/ui/button';
import { Undo2, Eraser } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureCreated: (signature: string) => void;
}

const SignatureCanvas = ({ onSignatureCreated }: SignatureCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const maxHistorySize = 10;

  // Check if canvas is empty
  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return !pixelData.some(channel => channel !== 0);
  };

  // Save canvas state to history before starting a new drawing stroke
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const currentState = canvas.toDataURL();
    const newHistory = [...canvasHistory.slice(0, historyIndex + 1), currentState];
    
    // Limit history size
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
      setCanvasHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } else {
      setCanvasHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Save current canvas state before starting to draw
    saveCanvasState();

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    setIsDrawing(true);
    setLastX((e.clientX - rect.left) * scaleX);
    setLastY((e.clientY - rect.top) * scaleY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();

    setLastX(x);
    setLastY(y);
    setHasDrawn(true);
  };

  const endDrawing = () => {
    if (isDrawing && hasDrawn && canvasRef.current) {
      const canvas = canvasRef.current;
      if (!isCanvasEmpty()) {
        onSignatureCreated(trimCanvas(canvas, 10));
      }
    }
    setIsDrawing(false);
  };

  const undoLastAction = () => {
    if (historyIndex < 0 || canvasHistory.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Restore the state at current historyIndex
    if (historyIndex >= 0) {
      const stateToRestore = canvasHistory[historyIndex];
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = stateToRestore;
      setHasDrawn(true);
    } else {
      setHasDrawn(false);
    }
    
    setHistoryIndex(historyIndex - 1);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    // Reset history when clearing
    setCanvasHistory([]);
    setHistoryIndex(-1);
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full rounded-lg border border-dashed border-border bg-muted/40">
        <canvas
          ref={canvasRef}
          width={1200}
          height={400}
          className="relative z-10 block w-full h-56 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
        />
        {!hasDrawn && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Sign here with your mouse or trackpad
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={undoLastAction} disabled={historyIndex < 0}>
          <Undo2 className="w-4 h-4 mr-1" /> Undo
        </Button>
        <Button variant="outline" size="sm" onClick={() => { clearCanvas(); onSignatureCreated(''); }}>
          <Eraser className="w-4 h-4 mr-1" /> Clear
        </Button>
      </div>
    </div>
  );
};

export default SignatureCanvas;
