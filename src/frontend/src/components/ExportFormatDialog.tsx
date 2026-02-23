import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, Table } from 'lucide-react';
import { useState } from 'react';

interface ExportFormatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (format: 'pdf' | 'excel') => void;
  title?: string;
  description?: string;
}

export default function ExportFormatDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Select Export Format',
  description = 'Choose the format for your exported data',
}: ExportFormatDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel'>('excel');

  const handleConfirm = () => {
    onConfirm(selectedFormat);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as 'pdf' | 'excel')}>
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex items-center gap-3 cursor-pointer flex-1">
                <FileText className="h-5 w-5 text-red-500" />
                <div>
                  <div className="font-medium">JSON</div>
                  <div className="text-sm text-muted-foreground">JavaScript Object Notation</div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
              <RadioGroupItem value="excel" id="excel" />
              <Label htmlFor="excel" className="flex items-center gap-3 cursor-pointer flex-1">
                <Table className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">CSV</div>
                  <div className="text-sm text-muted-foreground">Comma-Separated Values</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
