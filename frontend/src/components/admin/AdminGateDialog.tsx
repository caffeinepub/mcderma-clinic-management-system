import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useSetupAdminConfig, useVerifyAdminPassword, useGetAdminConfig } from '../../hooks/useQueries';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AdminGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
}

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function AdminGateDialog({
  open,
  onOpenChange,
  onUnlocked,
}: AdminGateDialogProps) {
  const { data: adminConfig, isLoading: configLoading } = useGetAdminConfig();
  const setupAdmin = useSetupAdminConfig();
  const verifyPassword = useVerifyAdminPassword();

  const [password, setPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isFirstTime = !configLoading && (!adminConfig || !adminConfig.hashedPassword);

  const handleSetup = async () => {
    if (!password || password.length < 4) {
      toast.error('Password must be at least 4 digits');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!securityQuestion.trim()) {
      toast.error('Please enter a security question');
      return;
    }
    if (!securityAnswer.trim()) {
      toast.error('Please enter a security answer');
      return;
    }
    try {
      await setupAdmin.mutateAsync({
        password,
        securityQuestion: securityQuestion.trim(),
        securityAnswer: securityAnswer.trim(),
      });
      toast.success('Admin password set up successfully');
      onUnlocked();
      onOpenChange(false);
    } catch {
      toast.error('Failed to set up admin password');
    }
  };

  const handleVerify = async () => {
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    try {
      const isValid = await verifyPassword.mutateAsync(password);
      if (isValid) {
        toast.success('Admin access granted');
        onUnlocked();
        onOpenChange(false);
        setPassword('');
      } else {
        toast.error('Incorrect password');
      }
    } catch {
      toast.error('Failed to verify password');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" />
            {isFirstTime ? 'Set Up Admin Password' : 'Admin Access'}
          </DialogTitle>
          <DialogDescription>
            {isFirstTime
              ? 'Create a numeric password to protect admin settings.'
              : 'Enter your admin password to continue.'}
          </DialogDescription>
        </DialogHeader>

        {configLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : isFirstTime ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Password (numeric)</Label>
              <Input
                type="password"
                inputMode="numeric"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                inputMode="numeric"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Security Question</Label>
              <Input
                placeholder="e.g. What is your pet's name?"
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Security Answer</Label>
              <Input
                placeholder="Your answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSetup}
              disabled={setupAdmin.isPending}
              className="w-full"
            >
              {setupAdmin.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              Set Up Admin
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                inputMode="numeric"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={verifyPassword.isPending}
              className="w-full"
            >
              {verifyPassword.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              Unlock
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
