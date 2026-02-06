import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function AuthGate() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/assets/generated/mama-bg.dim_1920x1080.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      <div className="relative z-10 max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <img 
            src="/assets/generated/mama-logo.dim_512x512.png" 
            alt="لوگوی ماما" 
            className="w-32 h-32 mx-auto"
          />
          <h1 className="text-4xl font-bold text-foreground">ماما</h1>
          <p className="text-lg text-muted-foreground">
            همراه دانش هوشمند فارسی شما
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            برای دسترسی به گفتگوی خصوصی، بحث‌های عمومی و سیستم دانش مغز ماما وارد شوید.
          </p>
          
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال ورود...
              </>
            ) : (
              'ورود با هویت اینترنتی'
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          احراز هویت امن توسط اینترنت کامپیوتر
        </p>
      </div>
    </div>
  );
}
