import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus, isLoginError } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  const isLoading = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img 
            src="/assets/generated/clinic-icon-transparent.dim_64x64.png" 
            alt="Clinic Icon" 
            className="h-16 w-16 mx-auto"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            McDerma
          </h1>
          <p className="text-muted-foreground">Clinic Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Secure login with Internet Identity for cross-device data synchronization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Your clinic data is securely stored and synchronized across all your devices.
              </p>
              <p>
                Click below to login or create a new account using Internet Identity.
              </p>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Login with Internet Identity
                </>
              )}
            </Button>

            {isLoginError && (
              <p className="text-sm text-destructive text-center">
                Login failed. Please try again.
              </p>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                New to Internet Identity? The login process will guide you through creating a secure account.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          © 2025. Built with ❤️ using{' '}
          <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
