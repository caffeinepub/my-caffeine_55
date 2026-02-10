import { useGetPublicTransparencyStats, useGetPublicMessages, useGetAggregateVarietySeed, useGetAllCategoryStats } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MessageSquare, Globe, Brain, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import { ChatMessageList } from '../components/chat/ChatMessageList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function TransparencyPage() {
  // Auto-refresh every 15 seconds
  const REFRESH_INTERVAL = 15000;

  const { 
    data: stats, 
    isLoading: statsLoading, 
    isError: statsError,
    refetch: refetchStats 
  } = useGetPublicTransparencyStats({ refetchInterval: REFRESH_INTERVAL });

  const { 
    data: publicMessages, 
    isLoading: messagesLoading, 
    refetch: refetchMessages 
  } = useGetPublicMessages({ refetchInterval: REFRESH_INTERVAL });

  const {
    data: aggregateSeed,
    isLoading: seedLoading,
    refetch: refetchSeed,
  } = useGetAggregateVarietySeed({ refetchInterval: REFRESH_INTERVAL });

  const {
    data: categoryStats,
    isLoading: categoryStatsLoading,
    refetch: refetchCategoryStats,
  } = useGetAllCategoryStats({ refetchInterval: REFRESH_INTERVAL });

  const publicCount = stats?.totalPublicMessages || BigInt(0);
  const privateCount = stats?.totalPrivateMessages || BigInt(0);
  const faqCount = stats?.totalFaqEntries || BigInt(0);

  const handleRefresh = () => {
    refetchStats();
    refetchMessages();
    refetchSeed();
    refetchCategoryStats();
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

      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            خطا در بارگذاری آمار. لطفاً دوباره تلاش کنید.
          </AlertDescription>
        </Alert>
      )}

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
            <p className="text-xs text-muted-foreground">داده‌های گفتگوهای خصوصی</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ورودی‌های پایگاه دانش</CardTitle>
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

      {/* Self-Improvement Indicators Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>شاخص‌های خودبهبودی</CardTitle>
          </div>
          <CardDescription>
            داده‌های ناشناس و تجمیعی برای بهبود خودکار ماما
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Aggregate Variety Seed */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">دانه تنوع تجمیعی</p>
                <p className="text-xs text-muted-foreground">
                  عدد تعیین‌کننده تنوع خودکار پاسخ‌ها
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold">
              {seedLoading ? '...' : aggregateSeed?.toString() || '0'}
            </div>
          </div>

          {/* Anonymized Category Stats */}
          <div>
            <h3 className="font-medium mb-3">دسته‌بندی‌های ناشناس</h3>
            <p className="text-xs text-muted-foreground mb-3">
              فقط داده‌های تجمیعی و ناشناس - بدون محتوای خام پیام‌ها
            </p>
            {categoryStatsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : categoryStats && categoryStats.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">دسته</TableHead>
                      <TableHead className="text-right">میانگین امتیاز</TableHead>
                      <TableHead className="text-right">تعداد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryStats.slice(0, 10).map(([category, avgScore, count], idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{category}</TableCell>
                        <TableCell>{avgScore.toFixed(3)}</TableCell>
                        <TableCell>{count.toString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">هنوز داده‌ای جمع‌آوری نشده است</p>
              </div>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>حریم خصوصی:</strong> تمام داده‌های نمایش داده شده ناشناس و تجمیعی هستند.
              هیچ متن خام پیام خصوصی یا شناسه کاربری ذخیره یا نمایش داده نمی‌شود.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

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
