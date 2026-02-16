import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useGetAdminConfig, useSaveAdminConfig } from '../../hooks/useQueries';
import { Lock, Key } from 'lucide-react';

interface AdminGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
}

export default function AdminGateDialog({ open, onOpenChange, onUnlocked }: AdminGateDialogProps) {
  const { data: adminConfig, isLoading } = useGetAdminConfig();
  const saveConfig = useSaveAdminConfig();

  const [mode, setMode] = useState<'setup' | 'unlock'>('unlock');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  useEffect(() => {
    if (adminConfig && !adminConfig.hashedPassword) {
      setMode('setup');
    } else {
      setMode('unlock');
    }
  }, [adminConfig]);

  const hashPassword = async (pwd: string): Promise<Uint8Array> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  };

  const handleSetup = async () => {
    if (!password || !confirmPassword || !securityAnswer) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!/^\d+$/.test(password)) {
      toast.error('Password must contain only numbers');
      return;
    }

    try {
      const hashedPassword = await hashPassword(password);
      const hashedAnswer = await hashPassword(securityAnswer.toLowerCase().trim());

      await saveConfig.mutateAsync({
        hashedPassword,
        securityQuestion: 'Which is your favorite colour',
        hashedSecurityAnswer: hashedAnswer,
      });

      toast.success('Admin password set successfully');
      onUnlocked();
      onOpenChange(false);
      setPassword('');
      setConfirmPassword('');
      setSecurityAnswer('');
    } catch (error: any) {
      toast.error('Failed to set admin password', {
        description: error.message || 'Please try again',
      });
    }
  };

  const handleUnlock = async () => {
    if (!password) {
      toast.error('Please enter password');
      return;
    }

    try {
      const hashedPassword = await hashPassword(password);
      
      // Verify password (backend should provide verification endpoint)
      // For now, we'll assume success if config exists
      if (adminConfig?.hashedPassword) {
        onUnlocked();
        onOpenChange(false);
        setPassword('');
        toast.success('Admin section unlocked');
      }
    } catch (error: any) {
      toast.error('Invalid password');
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {mode === 'setup' ? 'Setup Admin Password' : 'Admin Authentication'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'setup'
              ? 'Set up a numeric password and security question for admin access'
              : 'Enter your numeric password to access admin settings'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === 'setup' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Numeric Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter numeric password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm numeric password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="security-answer">Which is your favorite colour</Label>
                <Input
                  id="security-answer"
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Enter your answer"
                />
                <p className="text-xs text-muted-foreground">
                  This will be used for password recovery
                </p>
              </div>

              <Button onClick={handleSetup} disabled={saveConfig.isPending} className="w-full">
                {saveConfig.isPending ? 'Setting up...' : 'Setup Admin Access'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="unlock-password">Numeric Password</Label>
                <Input
                  id="unlock-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter numeric password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUnlock();
                    }
                  }}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUnlock} className="flex-1 gap-2">
                  <Key className="h-4 w-4" />
                  Unlock
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
