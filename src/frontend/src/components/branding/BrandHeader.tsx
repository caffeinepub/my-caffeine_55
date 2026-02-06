import { LoginButton } from '../auth/LoginButton';

interface BrandHeaderProps {
  userName?: string;
}

export function BrandHeader({ userName }: BrandHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LoginButton />
            {userName && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                خوش آمدید، {userName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-foreground">ماما</h1>
              <p className="text-xs text-muted-foreground">همراه دانش هوشمند فارسی</p>
            </div>
            <img 
              src="/assets/generated/mama-logo.dim_512x512.png" 
              alt="لوگوی ماما" 
              className="w-12 h-12"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
