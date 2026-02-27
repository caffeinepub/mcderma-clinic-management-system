import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ContactImportReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  contactMobile: string;
  onConfirm: (name: string, mobile: string) => void;
}

export default function ContactImportReviewDialog({
  open,
  onOpenChange,
  contactName,
  contactMobile,
  onConfirm,
}: ContactImportReviewDialogProps) {
  const [name, setName] = useState(contactName);
  const [mobile, setMobile] = useState(contactMobile);

  useEffect(() => {
    if (open) {
      setName(contactName);
      setMobile(contactMobile);
    }
  }, [open, contactName, contactMobile]);

  const handleConfirm = () => {
    onConfirm(name, mobile);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review Contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="review-name">Name</Label>
            <Input
              id="review-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-mobile">Mobile Number</Label>
            <Input
              id="review-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter mobile number"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Use
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
