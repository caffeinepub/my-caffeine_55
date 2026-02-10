import { useGetCallerUserProfile } from '../../hooks/useQueries';
import { BrandHeader } from '../branding/BrandHeader';
import { Button } from '@/components/ui/button';
import { MessageSquare, Globe, BarChart3, Brain } from 'lucide-react';

type PageView = 'private-chat' | 'public-chat' | 'transparency' | 'mama-brain';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
}

export function AppLayout({ children, currentPage, onNavigate }: AppLayoutProps) {
  const { data: userProfile } = useGetCallerUserProfile();

  const navItems = [
    { id: 'private-chat' as PageView, label: 'گفتگوی خصوصی', icon: MessageSquare },
    { id: 'public-chat' as PageView, label: 'گفتگوی عمومی', icon: Globe },
    { id: 'transparency' as PageView, label: 'شفافیت', icon: BarChart3 },
    { id: 'mama-brain' as PageView, label: 'مغز ماما', icon: Brain },
  ];

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: 'url(/assets/generated/mama-bg.dim_1920x1080.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <BrandHeader userName={userProfile?.name} />

        <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onNavigate(item.id)}
                    className="whitespace-nowrap"
                  >
                    <Icon className="ml-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>

        <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-4">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © ۲۰۲۶. ساخته شده با ❤️ توسط{' '}
            <a 
              href="https://caffeine.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
