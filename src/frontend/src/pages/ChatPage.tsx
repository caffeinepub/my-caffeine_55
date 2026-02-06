import { useState, useEffect, useRef } from 'react';
import { useGetPrivateMessages, useGetPublicMessages, useSendMessage, useFindFaqMatch, useSaveFeedbackMetadata, useGetPppOptIn, useStoreAnonymizedSignal, useGetAllCategoryStats } from '../hooks/useQueries';
import { ChatMessageList } from '../components/chat/ChatMessageList';
import { ChatComposer } from '../components/chat/ChatComposer';
import { ExternalKnowledgePanel } from '../components/external-knowledge/ExternalKnowledgePanel';
import { HeartbeatPipelineIndicator } from '../components/chat/HeartbeatPipelineIndicator';
import { PrivacyPreservingLearningToggle } from '../components/chat/PrivacyPreservingLearningToggle';
import { runMamaPipeline, type PipelineStep, type PipelineFeedback } from '../lib/mamaPipeline';
import { extractErrorInfo, createDebugLog } from '../utils/chatErrors';
import { sanitizeUserPrompt, normalizePersianText } from '../utils/persianText';
import { deriveAnonymizedSignals } from '../utils/privacyPreservingSignals';
import { correctPersianKeyboard } from '../utils/persianKeyboardCorrection';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActorReadiness } from '../hooks/useActorReadiness';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { LogIn, ChevronDown } from 'lucide-react';

interface ChatPageProps {
  mode: 'private' | 'public';
}

export function ChatPage({ mode }: ChatPageProps) {
  const [lastUserQuery, setLastUserQuery] = useState('');
  const [showExternalKnowledge, setShowExternalKnowledge] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [showPipeline, setShowPipeline] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<PipelineFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastTemplateKey, setLastTemplateKey] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { identity, login } = useInternetIdentity();
  const { readiness, isReady, isConnecting } = useActorReadiness();
  const privateMessages = useGetPrivateMessages();
  const publicMessages = useGetPublicMessages();
  const sendMessage = useSendMessage();
  const findFaqMatch = useFindFaqMatch();
  const saveFeedbackMetadata = useSaveFeedbackMetadata();
  const { data: pppOptIn } = useGetPppOptIn();
  const storeSignal = useStoreAnonymizedSignal();
  const { data: categoryStats } = useGetAllCategoryStats();

  const messages = mode === 'private' ? privateMessages.data : publicMessages.data;
  const isLoading = mode === 'private' ? privateMessages.isLoading : publicMessages.isLoading;
  const isAuthenticated = !!identity;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const isPublic = mode === 'public';

    // Check authentication first
    if (!isAuthenticated) {
      toast.error('لطفاً ابتدا وارد شوید', {
        action: {
          label: 'ورود',
          onClick: () => login(),
        },
      });
      throw new Error('Not authenticated');
    }

    // Check actor readiness - block send if still connecting
    if (!isReady || readiness.status === 'connecting') {
      toast.error('در حال اتصال... لطفاً لحظه‌ای صبر کنید', {
        description: 'اتصال در حال برقراری است',
      });
      throw new Error('Actor not ready');
    }

    // Reset pipeline state
    setShowPipeline(true);
    setShowFeedback(false);
    setLatestFeedback(null);

    try {
      // Step 1: Send user message first (unchanged behavior)
      await sendMessage.mutateAsync({ content, isPublic });

      // Step 2: Derive aggregate seed for Public Chat (deterministic variety)
      let aggregateSeed: number | undefined;
      if (isPublic && categoryStats && categoryStats.length > 0) {
        // Use sum of all category scores as seed
        aggregateSeed = categoryStats.reduce((sum, [_, score]) => sum + score, 0);
      }

      // Step 3: Run the 7-step Mama brain pipeline with anti-repetition
      const pipelineResult = await runMamaPipeline(
        content,
        async (question) => {
          const result = await findFaqMatch.mutateAsync(question);
          return result;
        },
        (steps) => {
          setPipelineSteps(steps);
        },
        lastTemplateKey,
        aggregateSeed
      );

      // Update last template key for next message
      if (pipelineResult.selectedTemplateKey) {
        setLastTemplateKey(pipelineResult.selectedTemplateKey);
      }

      // Store feedback for UI display
      setLatestFeedback(pipelineResult.feedback);
      setShowFeedback(true);

      // Step 4: Save structured feedback metadata to backend
      const feedbackCategory = 
        pipelineResult.feedback.responseSource === 'faq' ? 'دانش' :
        pipelineResult.feedback.responseSource === 'civic-empowerment' ? 'توانمندسازی مدنی' :
        'همدلانه';
      
      const feedbackExplanation = 
        pipelineResult.feedback.responseSource === 'faq' ? 'پاسخ از بانک دانش ماما' :
        pipelineResult.feedback.responseSource === 'civic-empowerment' ? 'راهنمایی مدنی و مسالمت‌آمیز' :
        `پاسخ همدلانه شماره ${(pipelineResult.feedback.empatheticIndex || 0) + 1}`;

      try {
        await saveFeedbackMetadata.mutateAsync({
          category: feedbackCategory,
          explanation: feedbackExplanation,
          userPrompt: sanitizeUserPrompt(content),
        });
      } catch (error) {
        // Non-critical: log but don't block the flow
        console.error('Failed to save feedback metadata:', error instanceof Error ? error.message : 'Unknown error');
      }

      // Step 5: Privacy-preserving learning (Private Chat only, opt-in)
      if (!isPublic && pppOptIn) {
        try {
          // Correct and normalize the message
          const correctionResult = correctPersianKeyboard(content);
          const normalizedMessage = normalizePersianText(correctionResult.corrected);
          
          // Derive anonymized signals (NO raw text)
          const signals = deriveAnonymizedSignals(normalizedMessage);
          
          // Store each signal (non-blocking)
          for (const signal of signals) {
            storeSignal.mutate({
              category: signal.category,
              normalizedScore: signal.normalizedScore,
            });
          }
        } catch (error) {
          // Non-critical: log but don't block
          console.error('Failed to store anonymized signals:', error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Step 6: Send Mama's response
      await sendMessage.mutateAsync({ 
        content: pipelineResult.responseContent, 
        isPublic 
      });

      // Update last query for external knowledge
      setLastUserQuery(content);

      // Show success toast based on response source
      if (pipelineResult.feedback.responseSource === 'faq') {
        toast.success('پاسخ در مغز ماما یافت شد!');
      } else if (pipelineResult.feedback.responseSource === 'civic-empowerment') {
        toast.success('ماما راهنمایی مدنی ارائه داد');
      } else {
        toast.success('ماما با محبت پاسخ داد');
      }
    } catch (error) {
      // Create structured debug log with all required fields
      createDebugLog('send', error, { 
        isPublic, 
        contentLength: content.length,
        actorReady: isReady,
        identityPresent: isAuthenticated,
      });
      
      const errorInfo = extractErrorInfo(error);
      
      // Only show login CTA for auth-class errors
      if (errorInfo.classification === 'auth') {
        toast.error(errorInfo.userMessage, {
          action: {
            label: 'ورود',
            onClick: () => login(),
          },
        });
      } else if (errorInfo.classification === 'actor-not-ready') {
        // Non-blocking connecting status - already handled by UI
        toast.error(errorInfo.userMessage, {
          description: 'لطفاً منتظر بمانید تا اتصال کامل شود',
        });
      } else {
        toast.error(errorInfo.userMessage);
      }
      
      // Re-throw to prevent composer from clearing
      throw error;
    }
  };

  const handleDismissPipeline = () => {
    setShowPipeline(false);
  };

  const allStepsCompleted = pipelineSteps.length > 0 && pipelineSteps.every(s => s.status === 'completed');

  // Determine if send should be disabled
  const canSend = isAuthenticated && isReady;

  // Get Persian label for response source
  const getResponseSourceLabel = (source: string) => {
    switch (source) {
      case 'faq':
        return 'بانک دانش';
      case 'civic-empowerment':
        return 'توانمندسازی مدنی';
      case 'empathetic':
        return 'پاسخ همدلانه';
      default:
        return 'نامشخص';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {mode === 'private' ? 'گفتگوی خصوصی' : 'گفتگوی عمومی'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === 'private' 
                  ? 'گفتگوی شخصی شما با ماما' 
                  : 'به بحث جامعه بپیوندید'}
              </p>
            </div>
            {!isAuthenticated && (
              <Button onClick={() => login()} size="sm" variant="outline">
                <LogIn className="ml-2 h-4 w-4" />
                ورود برای گفتگو
              </Button>
            )}
          </div>

          {/* Privacy-preserving learning toggle (Private Chat only) */}
          {mode === 'private' && isAuthenticated && (
            <PrivacyPreservingLearningToggle />
          )}

          <Tabs value={showExternalKnowledge ? 'knowledge' : 'chat'} onValueChange={(v) => setShowExternalKnowledge(v === 'knowledge')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">گفتگو</TabsTrigger>
              <TabsTrigger value="knowledge">دانش خارجی</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              {/* Pipeline Indicator */}
              {showPipeline && pipelineSteps.length > 0 && (
                <HeartbeatPipelineIndicator
                  steps={pipelineSteps}
                  onDismiss={handleDismissPipeline}
                  canDismiss={allStepsCompleted}
                />
              )}

              {/* Feedback Panel */}
              {showFeedback && latestFeedback && allStepsCompleted && (
                <Collapsible open={showFeedback} onOpenChange={setShowFeedback}>
                  <Card className="p-4 bg-secondary/20 border-secondary">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="text-sm font-medium">بازخورد پردازش</span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">
                          <span className="font-semibold">منبع پاسخ:</span>{' '}
                          {getResponseSourceLabel(latestFeedback.responseSource)}
                        </p>
                        {latestFeedback.correctionApplied && (
                          <p className="text-muted-foreground">
                            <span className="font-semibold">اصلاح کیبورد:</span> اعمال شد
                          </p>
                        )}
                        {latestFeedback.empatheticIndex !== undefined && (
                          <p className="text-muted-foreground">
                            <span className="font-semibold">شماره پاسخ:</span> {latestFeedback.empatheticIndex + 1}
                          </p>
                        )}
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="font-semibold mb-1">مراحل پردازش:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {latestFeedback.stepsSummary.map((step, idx) => (
                              <li key={idx} className="text-muted-foreground">{step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              <div className="h-[500px] overflow-y-auto border rounded-lg p-4 bg-background/50">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">در حال بارگذاری پیام‌ها...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ChatMessageList messages={messages || []} />
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <ChatComposer 
                onSend={handleSendMessage} 
                disabled={!canSend}
                isConnecting={isAuthenticated && isConnecting}
                connectingMessage="در حال اتصال..."
              />
            </TabsContent>

            <TabsContent value="knowledge">
              <ExternalKnowledgePanel query={lastUserQuery} />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
