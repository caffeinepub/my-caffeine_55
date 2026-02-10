import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { AuthGate } from './components/auth/AuthGate';
import { ProfileSetupModal } from './components/auth/ProfileSetupModal';
import { AppLayout } from './components/layout/AppLayout';
import { ChatPage } from './pages/ChatPage';
import { TransparencyPage } from './pages/TransparencyPage';
import { MamaBrainPage } from './pages/MamaBrainPage';
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

type PageView = 'private-chat' | 'public-chat' | 'transparency' | 'mama-brain';

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [currentPage, setCurrentPage] = useState<PageView>('private-chat');

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AuthGate />
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {showProfileSetup && <ProfileSetupModal />}
        
        {currentPage === 'private-chat' && <ChatPage mode="private" />}
        {currentPage === 'public-chat' && <ChatPage mode="public" />}
        {currentPage === 'transparency' && <TransparencyPage />}
        {currentPage === 'mama-brain' && <MamaBrainPage />}
      </AppLayout>
      <Toaster />
    </ThemeProvider>
  );
}
