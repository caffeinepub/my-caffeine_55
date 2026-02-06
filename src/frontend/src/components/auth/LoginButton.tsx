import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Clear all cached data on logout
      await clear();
      queryClient.clear();
      toast.success('با موفقیت خارج شدید');
    } else {
      try {
        await login();
        // After successful login, refetch all queries
        queryClient.invalidateQueries();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error('ورود ناموفق بود. لطفاً دوباره تلاش کنید');
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={disabled}
      variant={isAuthenticated ? 'outline' : 'default'}
      size="sm"
    >
      {disabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isAuthenticated ? (
        <>
          <LogOut className="ml-2 h-4 w-4" />
          خروج
        </>
      ) : (
        <>
          <LogIn className="ml-2 h-4 w-4" />
          ورود
        </>
      )}
    </Button>
  );
}
