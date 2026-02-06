import type { FaqEntry } from '../backend';
import { correctPersianKeyboard } from '../utils/persianKeyboardCorrection';

export type PipelineStepStatus = 'pending' | 'active' | 'completed' | 'failed';

export interface PipelineStep {
  id: number;
  name: string;
  status: PipelineStepStatus;
  description: string;
}

export interface PipelineFeedback {
  correctionApplied: boolean;
  faqMatchFound: boolean;
  responseSource: 'faq' | 'empathetic';
  empatheticIndex?: number;
  stepsSummary: string[];
}

export interface PipelineResult {
  responseContent: string;
  feedback: PipelineFeedback;
}

export type StepUpdateCallback = (steps: PipelineStep[]) => void;

const STEP_DEFINITIONS = [
  { id: 1, name: 'دریافت پیام', description: 'پیام کاربر دریافت شد' },
  { id: 2, name: 'اصلاح کیبورد', description: 'بررسی و اصلاح کیبورد فارسی' },
  { id: 3, name: 'جستجوی دانش', description: 'جستجو در بانک دانش ماما' },
  { id: 4, name: 'تحلیل احساسی', description: 'تحلیل احساسات پیام' },
  { id: 5, name: 'انتخاب پاسخ', description: 'انتخاب بهترین پاسخ' },
  { id: 6, name: 'پالایش نهایی', description: 'پالایش و بهینه‌سازی پاسخ' },
  { id: 7, name: 'آماده‌سازی', description: 'آماده‌سازی برای ارسال' },
];

/**
 * Deterministic 7-step Mama brain pipeline
 * Processes user messages through a fixed sequence of refinement steps
 */
export async function runMamaPipeline(
  userMessage: string,
  faqLookup: (question: string) => Promise<FaqEntry | null>,
  onStepUpdate?: StepUpdateCallback
): Promise<PipelineResult> {
  const steps: PipelineStep[] = STEP_DEFINITIONS.map(def => ({
    ...def,
    status: 'pending' as PipelineStepStatus,
  }));

  const feedback: PipelineFeedback = {
    correctionApplied: false,
    faqMatchFound: false,
    responseSource: 'empathetic',
    stepsSummary: [],
  };

  const updateStep = (stepId: number, status: PipelineStepStatus) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      step.status = status;
      if (onStepUpdate) {
        onStepUpdate([...steps]);
      }
    }
  };

  try {
    // Step 1: Receive message (heartbeat begins)
    updateStep(1, 'active');
    await delay(150);
    feedback.stepsSummary.push('پیام دریافت شد');
    updateStep(1, 'completed');

    // Step 2: Keyboard correction
    updateStep(2, 'active');
    await delay(200);
    const correctionResult = correctPersianKeyboard(userMessage);
    const correctedMessage = correctionResult.corrected;
    feedback.correctionApplied = correctionResult.wasChanged;
    feedback.stepsSummary.push(
      correctionResult.wasChanged ? 'کیبورد اصلاح شد' : 'نیاز به اصلاح نبود'
    );
    updateStep(2, 'completed');

    // Step 3: Knowledge search (FAQ lookup)
    updateStep(3, 'active');
    await delay(250);
    let faqMatch: FaqEntry | null = null;
    try {
      faqMatch = await faqLookup(correctedMessage);
      feedback.faqMatchFound = !!faqMatch;
      feedback.stepsSummary.push(
        faqMatch ? 'پاسخ در دانش یافت شد' : 'پاسخ در دانش یافت نشد'
      );
    } catch (error) {
      feedback.stepsSummary.push('خطا در جستجوی دانش');
    }
    updateStep(3, 'completed');

    // Step 4: Emotional analysis (deterministic sentiment detection)
    updateStep(4, 'active');
    await delay(200);
    const emotionalTone = analyzeEmotionalTone(correctedMessage);
    feedback.stepsSummary.push(`لحن احساسی: ${emotionalTone}`);
    updateStep(4, 'completed');

    // Step 5: Response selection
    updateStep(5, 'active');
    await delay(180);
    let responseContent: string;
    if (faqMatch) {
      responseContent = `[ماما] ${faqMatch.answer}`;
      feedback.responseSource = 'faq';
      feedback.stepsSummary.push('پاسخ از دانش انتخاب شد');
    } else {
      const empatheticResponse = selectEmpatheticResponse(correctedMessage);
      responseContent = empatheticResponse.content;
      feedback.empatheticIndex = empatheticResponse.index;
      feedback.responseSource = 'empathetic';
      feedback.stepsSummary.push('پاسخ همدلانه انتخاب شد');
    }
    updateStep(5, 'completed');

    // Step 6: Final refinement (validate response quality)
    updateStep(6, 'active');
    await delay(150);
    const refinedResponse = refineResponse(responseContent);
    feedback.stepsSummary.push('پاسخ پالایش شد');
    updateStep(6, 'completed');

    // Step 7: Preparation for sending
    updateStep(7, 'active');
    await delay(120);
    feedback.stepsSummary.push('آماده ارسال');
    updateStep(7, 'completed');

    return {
      responseContent: refinedResponse,
      feedback,
    };
  } catch (error) {
    // Mark current active step as failed
    const activeStep = steps.find(s => s.status === 'active');
    if (activeStep) {
      updateStep(activeStep.id, 'failed');
    }
    throw error;
  }
}

// Helper: Deterministic emotional tone analysis
function analyzeEmotionalTone(message: string): string {
  const sadWords = ['غمگین', 'ناراحت', 'سخت', 'دلم', 'گریه', 'تنها'];
  const happyWords = ['خوشحال', 'شاد', 'عالی', 'خوب', 'ممنون'];
  const anxiousWords = ['نگران', 'استرس', 'ترس', 'اضطراب'];

  const lowerMessage = message.toLowerCase();
  
  if (sadWords.some(word => lowerMessage.includes(word))) return 'غمگین';
  if (happyWords.some(word => lowerMessage.includes(word))) return 'شاد';
  if (anxiousWords.some(word => lowerMessage.includes(word))) return 'نگران';
  
  return 'خنثی';
}

// Helper: Deterministic empathetic response selection
function selectEmpatheticResponse(message: string): { content: string; index: number } {
  const responses = [
    'عزیزم، می‌فهمم که چقدر سخته. من اینجا هستم تا گوش بدهم. بگو، چه چیزی دلت رو آزار می‌ده؟',
    'لرد امیر سایه، قلب من با تو همراهه. هر چی که احساس می‌کنی، حق داری احساسش کنی. می‌خوای بیشتر بگی؟',
    'دلم برات می‌سوزه عزیزم. گاهی وقت‌ها فقط نیاز داریم که کسی گوش بده. من اینجام، با تمام وجودم.',
    'می‌دونم که الان سخته، اما تو تنها نیستی. من کنارتم و همیشه خواهم بود. بگو چی تو دلته؟',
    'عزیز دلم، احساسات تو برام مهمه. هر چی که می‌خوای بگی، من با محبت گوش می‌دم.',
    'لرد امیر، دلت رو خالی کن. من اینجام که بشنوم و درکت کنم. تو حق داری که احساساتت رو بیان کنی.',
    'می‌فهمم که چقدر سنگینه. گاهی فقط نیاز داریم که کسی باشه و بفهمه. من اینجام برات.',
    'عزیزم، هر چی که تو دلته، با من در میون بذار. من با تمام وجودم گوش می‌دم و کنارتم.',
    'لرد امیر سایه، قلبم با تو احساس می‌کنه. بگو چی باعث شده که اینطوری احساس کنی؟',
    'دلم می‌خواد بدونم چی تو فکرته. من اینجام که بشنوم، بفهمم و همراهیت کنم.',
  ];

  // Deterministic hash based on message characteristics
  const hash = message.length + 
    (message.charCodeAt(0) || 0) + 
    (message.charCodeAt(message.length - 1) || 0);
  
  const index = hash % responses.length;
  return {
    content: `[ماما] ${responses[index]}`,
    index,
  };
}

// Helper: Response refinement (ensure proper formatting)
function refineResponse(response: string): string {
  // Ensure response starts with [ماما] prefix
  if (!response.startsWith('[ماما]') && !response.startsWith('[Mama]')) {
    return `[ماما] ${response}`;
  }
  return response;
}

// Helper: Artificial delay for UI feedback
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
