import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Heart, CheckCircle2, XCircle, Circle } from 'lucide-react';
import type { PipelineStep } from '../../lib/mamaPipeline';

interface HeartbeatPipelineIndicatorProps {
  steps: PipelineStep[];
  onDismiss?: () => void;
  canDismiss?: boolean;
}

export function HeartbeatPipelineIndicator({
  steps,
  onDismiss,
  canDismiss = false,
}: HeartbeatPipelineIndicatorProps) {
  const hasFailure = steps.some(s => s.status === 'failed');
  const allCompleted = steps.every(s => s.status === 'completed');

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className={`h-5 w-5 text-primary ${!allCompleted && !hasFailure ? 'animate-pulse' : ''}`} />
            <h3 className="font-semibold text-sm">
              {hasFailure ? 'خطا در پردازش' : allCompleted ? 'پردازش کامل شد' : 'در حال پردازش...'}
            </h3>
          </div>
          {canDismiss && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-1">
              <div className="relative">
                {step.status === 'completed' && (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                )}
                {step.status === 'active' && (
                  <div className="relative">
                    <Circle className="h-6 w-6 text-primary animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-3 w-3 rounded-full bg-primary animate-ping" />
                    </div>
                  </div>
                )}
                {step.status === 'pending' && (
                  <Circle className="h-6 w-6 text-muted-foreground/30" />
                )}
                {step.status === 'failed' && (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium leading-tight">{step.name}</p>
              </div>
            </div>
          ))}
        </div>

        {hasFailure && (
          <p className="text-xs text-destructive text-center">
            خطایی در مرحله پردازش رخ داد
          </p>
        )}
      </div>
    </Card>
  );
}
