import { useState } from 'react';
import { AdminGuard } from '../../components/auth/AdminGuard';
import { useAddFaqEntry } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FaqItem {
  question: string;
  answer: string;
}

const BATCH_SIZE = 5; // Process 5 items concurrently
const BATCH_DELAY = 50; // 50ms delay between batches

export function AdminFaqImportPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<{ total: number; success: number; failed: number } | null>(null);
  
  const addFaqEntry = useAddFaqEntry();

  const processBatch = async (batch: FaqItem[]): Promise<{ success: number; failed: number }> => {
    const results = await Promise.allSettled(
      batch.map(item => {
        if (!item.question || !item.answer) {
          return Promise.reject(new Error('Invalid item'));
        }
        return addFaqEntry.mutateAsync({
          question: item.question,
          answer: item.answer,
        });
      })
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return { success, failed };
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(jsonInput) as FaqItem[];
      
      if (!Array.isArray(data)) {
        toast.error('Invalid format: Expected an array of FAQ items');
        return;
      }

      setImporting(true);
      setProgress(0);
      setStats({ total: data.length, success: 0, failed: 0 });

      let totalSuccess = 0;
      let totalFailed = 0;

      // Process in batches for better performance
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        
        const { success, failed } = await processBatch(batch);
        totalSuccess += success;
        totalFailed += failed;

        const processed = Math.min(i + BATCH_SIZE, data.length);
        setProgress((processed / data.length) * 100);
        setStats({ total: data.length, success: totalSuccess, failed: totalFailed });

        // Yield to UI thread between batches
        if (i + BATCH_SIZE < data.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      toast.success(`Import complete! ${totalSuccess} entries added, ${totalFailed} failed`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to parse JSON. Please check the format.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminGuard>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold">FAQ Import</h2>
          <p className="text-muted-foreground">Bulk import Persian Q&A pairs into the Mama Brain (batched processing)</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Import FAQ Data</CardTitle>
            <CardDescription>
              Paste JSON array of FAQ items. Format: {`[{"question": "...", "answer": "..."}]`}
              <br />
              <span className="text-xs">Processing in batches of {BATCH_SIZE} for optimal performance</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "question": "سلام چطوری؟",\n    "answer": "سلام! من ماما هستم. چطور می‌تونم کمکتون کنم؟"\n  }\n]`}
              className="min-h-[300px] font-mono text-sm"
              disabled={importing}
            />

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} />
                {stats && (
                  <p className="text-sm text-muted-foreground text-center">
                    Progress: {stats.success + stats.failed} / {stats.total} 
                    ({stats.success} success, {stats.failed} failed)
                  </p>
                )}
              </div>
            )}

            <Button 
              onClick={handleImport} 
              disabled={importing || !jsonInput.trim()}
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import FAQ Entries
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {stats && !importing && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Import completed: {stats.success} entries added successfully, {stats.failed} failed
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Example Format</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`[
  {
    "question": "ماما چیست؟",
    "answer": "ماما یک هوش مصنوعی فارسی است که برای کمک به شما طراحی شده است."
  },
  {
    "question": "چطور می‌توانم با ماما صحبت کنم؟",
    "answer": "می‌توانید در بخش چت خصوصی یا عمومی با من صحبت کنید."
  }
]`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
