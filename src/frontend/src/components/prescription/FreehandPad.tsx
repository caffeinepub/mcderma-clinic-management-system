import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Trash2 } from 'lucide-react';
import { ExternalBlob } from '../../backend';

interface FreehandPadProps {
  onSave: (blob: ExternalBlob) => void;
}

export default function FreehandPad({ onSave }: FreehandPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;

    // Set drawing styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setContext(ctx);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    if (isErasing) {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = 20;
    } else {
      context.globalCompositeOperation = 'source-over';
      context.lineWidth = 2;
    }

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    if (!context || !canvasRef.current) return;
    
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        const externalBlob = ExternalBlob.fromBytes(uint8Array);
        onSave(externalBlob);
      };
      reader.readAsArrayBuffer(blob);
    }, 'image/png');
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full cursor-crosshair touch-none"
          style={{ height: '400px' }}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => setIsErasing(!isErasing)}
          variant={isErasing ? 'default' : 'outline'}
          size="sm"
        >
          <Eraser className="h-4 w-4 mr-2" />
          {isErasing ? 'Drawing' : 'Eraser'}
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          size="sm"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button
          onClick={handleSave}
          size="sm"
          className="ml-auto"
        >
          Apply Drawing
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Draw your prescription using your mouse or touch screen. Use the eraser to make corrections.
      </p>
    </div>
  );
}
