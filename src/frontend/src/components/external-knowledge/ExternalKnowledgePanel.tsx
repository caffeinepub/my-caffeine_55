import { useWikipediaSummary } from '../../hooks/useWikipediaSummary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExternalKnowledgePanelProps {
  query: string;
}

export function ExternalKnowledgePanel({ query }: ExternalKnowledgePanelProps) {
  const { data, isLoading, error, refetch } = useWikipediaSummary(query);

  if (!query) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            برای جستجوی دانش خارجی، در گفتگو سوالی بپرسید
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">در حال جستجو در ویکی‌پدیا...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              دریافت دانش خارجی ناموفق بود. لطفاً دوباره تلاش کنید.
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="mt-4 w-full" variant="outline">
            تلاش مجدد
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">نتیجه‌ای یافت نشد</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        <CardDescription>از ویکی‌پدیا</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{data.extract}</p>
        
        {data.url && (
          <Button asChild variant="outline" className="w-full">
            <a href={data.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="ml-2 h-4 w-4" />
              ادامه مطلب در ویکی‌پدیا
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
