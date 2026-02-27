import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PrescriptionTypedFormProps {
  content: string;
  onChange: (content: string) => void;
}

export default function PrescriptionTypedForm({ content, onChange }: PrescriptionTypedFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prescription">Prescription Details</Label>
        <Textarea
          id="prescription"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter medicines, dosage, instructions, tests, etc."
          className="min-h-[300px] font-mono"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Enter prescription details including medicine names, dosage, frequency, duration, and any special instructions.
      </p>
    </div>
  );
}
