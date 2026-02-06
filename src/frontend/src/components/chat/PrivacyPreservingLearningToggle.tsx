import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGetPppOptIn, useSetPppOptIn } from '../../hooks/useQueries';
import { Loader2 } from 'lucide-react';

export function PrivacyPreservingLearningToggle() {
  const { data: optIn, isLoading } = useGetPppOptIn();
  const setOptIn = useSetPppOptIn();

  const handleToggle = async (checked: boolean) => {
    try {
      await setOptIn.mutateAsync(checked);
    } catch (error) {
      console.error('Failed to update opt-in preference:', error);
    }
  };

  return (
    <Card className="bg-secondary/10 border-secondary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">یادگیری حفظ حریم خصوصی</CardTitle>
        <CardDescription className="text-xs">
          با فعال‌سازی این گزینه، ماما می‌تواند از الگوهای ناشناس گفتگوی شما برای بهبود پاسخ‌های عمومی استفاده کند. هیچ متن خامی ذخیره نمی‌شود.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="ppp-toggle" className="text-sm cursor-pointer">
            مشارکت در یادگیری
          </Label>
          <div className="flex items-center gap-2">
            {(isLoading || setOptIn.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Switch
              id="ppp-toggle"
              checked={optIn || false}
              onCheckedChange={handleToggle}
              disabled={isLoading || setOptIn.isPending}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
