import { useGetChatStats, useGetPublicMessages } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MessageSquare, Globe, Brain } from 'lucide-react';
import { ChatMessageList } from '../components/chat/ChatMessageList';

export function TransparencyPage() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetChatStats();
  const { data: publicMessages, isLoading: messagesLoading, refetch: refetchMessages } = useGetPublicMessages();

  const [publicCount, privateCount, faqCount] = stats || [BigInt(0), BigInt(0), BigInt(0)];

  const handleRefresh = () => {
    refetchStats();
    refetchMessages();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">داشبورد شفافیت</h2>
          <p className="text-muted-foreground">آمار سیستم و فعالیت عمومی</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="ml-2 h-4 w-4" />
          بروزرسانی
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">پیام‌های عمومی</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : publicCount.toString()}
            </div>
            <p className="text-xs text-muted-foreground">کل گفتگوهای عمومی</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">گفتگوهای خصوصی</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : privateCount.toString()}
            </div>
            <p className="text-xs text-muted-foreground">گفتگوهای خصوصی فعال</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ورودی‌های FAQ</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : faqCount.toString()}
            </div>
            <p className="text-xs text-muted-foreground">ورودی‌های پایگاه دانش</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>پیام‌های عمومی اخیر</CardTitle>
          <CardDescription>
            آخرین گفتگوها در اتاق گفتگوی عمومی
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] overflow-y-auto border rounded-lg p-4 bg-background/50">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">در حال بارگذاری پیام‌ها...</p>
                </div>
              </div>
            ) : (
              <ChatMessageList messages={publicMessages || []} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
