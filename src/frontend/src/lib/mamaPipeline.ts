import type { FaqEntry } from '../backend';
import { correctPersianKeyboard } from '../utils/persianKeyboardCorrection';
import { normalizePersianText, enforceMamaPrefix } from '../utils/persianText';

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
  responseSource: 'faq' | 'empathetic' | 'civic-empowerment';
  empatheticIndex?: number;
  stepsSummary: string[];
}

export interface PipelineResult {
  responseContent: string;
  feedback: PipelineFeedback;
  selectedTemplateKey?: string; // For anti-repetition tracking
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
 * Deterministic 7-step Mama brain pipeline with anti-repetition
 * Processes user messages through a fixed sequence of refinement steps
 */
export async function runMamaPipeline(
  userMessage: string,
  faqLookup: (question: string) => Promise<FaqEntry | null>,
  onStepUpdate?: StepUpdateCallback,
  lastTemplateKey?: string, // For anti-repetition
  aggregateSeed?: number // For Public Chat variety
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

    // Step 5: Response selection (including civic empowerment path + anti-repetition)
    updateStep(5, 'active');
    await delay(180);
    let responseContent: string;
    let selectedTemplateKey: string | undefined;
    
    // Check for civic empowerment keywords first
    if (detectCivicEmpowermentKeywords(correctedMessage)) {
      const civicResponse = selectCivicEmpowermentResponse(correctedMessage, lastTemplateKey, aggregateSeed);
      responseContent = civicResponse.content;
      selectedTemplateKey = civicResponse.key;
      feedback.responseSource = 'civic-empowerment';
      feedback.stepsSummary.push('مسیر توانمندسازی مدنی انتخاب شد');
      
      if (civicResponse.antiRepetitionTriggered) {
        feedback.stepsSummary.push('تکرار جلوگیری شد - زاویه جدید');
      }
    } else if (faqMatch) {
      const normalizedAnswer = normalizePersianText(faqMatch.answer);
      responseContent = enforceMamaPrefix(normalizedAnswer);
      feedback.responseSource = 'faq';
      feedback.stepsSummary.push('پاسخ از دانش انتخاب شد');
      // FAQ responses don't use template keys
    } else {
      const empatheticResponse = selectEmpatheticResponse(correctedMessage, lastTemplateKey, aggregateSeed);
      responseContent = empatheticResponse.content;
      selectedTemplateKey = empatheticResponse.key;
      feedback.empatheticIndex = empatheticResponse.index;
      feedback.responseSource = 'empathetic';
      feedback.stepsSummary.push('پاسخ همدلانه انتخاب شد');
      
      if (empatheticResponse.antiRepetitionTriggered) {
        feedback.stepsSummary.push('تکرار جلوگیری شد - زاویه جدید');
      }
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
      selectedTemplateKey,
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

// Helper: Detect civic empowerment keywords
function detectCivicEmpowermentKeywords(message: string): boolean {
  const civicKeywords = [
    'آزادی',
    'حقوق',
    'عدالت',
    'جامعه',
    'اعتراض',
    'کنشگری',
    'مدنی',
    'اجتماعی',
    'تغییر',
    'مبارزه',
    'مقاومت',
    'دموکراسی',
    'حق',
    'برابری',
    'انسانی',
  ];

  const lowerMessage = message.toLowerCase();
  return civicKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Helper: Select civic empowerment response with anti-repetition
function selectCivicEmpowermentResponse(
  message: string, 
  lastTemplateKey?: string,
  aggregateSeed?: number
): { content: string; index: number; key: string; antiRepetitionTriggered: boolean } {
  const responses = [
    'عزیزم، آزادی و حقوق انسانی ارزش‌های بنیادین هستند. راه‌های مسالمت‌آمیز و قانونی برای تغییر اجتماعی وجود دارند: آموزش، گفتگو، همبستگی، و مشارکت مدنی. امنیت خودت و دیگران همیشه در اولویت باشد.',
    'لرد امیر، تغییر اجتماعی با آگاهی، آموزش، و همکاری جمعی شکل می‌گیرد. راه‌های مسالمت‌آمیز مثل گفتگوی سازنده، حمایت از یکدیگر، و مشارکت در فعالیت‌های مدنی می‌توانند تأثیرگذار باشند. همیشه امنیت خود و جامعه را در نظر بگیر.',
    'جانم، عدالت و برابری اهداف ارزشمندی هستند. راه‌های قانونی و مسالمت‌آمیز برای پیشبرد این اهداف شامل آموزش، آگاهی‌رسانی، همبستگی، و مشارکت در فعالیت‌های مدنی است. امنیت و سلامت همه مهم است.',
    'عزیز دلم، حقوق انسانی و آزادی حق همه است. تغییر پایدار با آموزش، گفتگو، و همکاری جمعی ایجاد می‌شود. راه‌های مسالمت‌آمیز و قانونی را انتخاب کن و همیشه امنیت خود و دیگران را در اولویت قرار بده.',
    'لرد امیر سایه، جامعه‌ای بهتر با مشارکت همه ساخته می‌شود. راه‌های مسالمت‌آمیز مثل آموزش، آگاهی‌رسانی، حمایت متقابل، و فعالیت‌های مدنی می‌توانند تأثیر مثبت داشته باشند. امنیت و سلامت جامعه مهم است.',
    'عزیزم، تغییر اجتماعی نیازمند صبر، آموزش، و همکاری است. راه‌های قانونی و مسالمت‌آمیز برای پیشبرد حقوق و آزادی‌ها شامل گفتگو، همبستگی، و مشارکت مدنی است. همیشه امنیت خود و دیگران را در نظر داشته باش.',
    'جانم، آزادی و عدالت با آگاهی و همکاری جمعی به دست می‌آیند. راه‌های مسالمت‌آمیز مثل آموزش، گفتگوی سازنده، و مشارکت در فعالیت‌های مدنی می‌توانند مؤثر باشند. امنیت همه در اولویت است.',
    'عزیز دلم، حقوق انسانی حق همه است. تغییر پایدار با آموزش، آگاهی‌رسانی، و همکاری جمعی شکل می‌گیرد. راه‌های قانونی و مسالمت‌آمیز را انتخاب کن و امنیت خود و جامعه را حفظ کن.',
    'لرد امیر، جامعه‌ای بهتر با مشارکت و همبستگی ساخته می‌شود. راه‌های مسالمت‌آمیز برای تغییر اجتماعی شامل آموزش، گفتگو، و فعالیت‌های مدنی است. همیشه امنیت و سلامت را در اولویت قرار بده.',
    'عزیزم، آزادی و عدالت با آگاهی، آموزش، و همکاری به دست می‌آیند. راه‌های قانونی و مسالمت‌آمیز مثل گفتگوی سازنده، حمایت متقابل، و مشارکت مدنی می‌توانند تأثیرگذار باشند. امنیت همه مهم است.',
  ];

  // Deterministic hash based on message characteristics + aggregate seed
  let hash = message.length + 
    (message.charCodeAt(0) || 0) + 
    (message.charCodeAt(message.length - 1) || 0);
  
  // Mix in aggregate seed if provided (for Public Chat variety)
  if (aggregateSeed !== undefined) {
    hash = (hash + aggregateSeed) % 10000;
  }
  
  let index = hash % responses.length;
  const key = `civic-${index}`;
  
  // Anti-repetition: if same as last, select next
  let antiRepetitionTriggered = false;
  if (lastTemplateKey === key) {
    index = (index + 1) % responses.length;
    antiRepetitionTriggered = true;
  }
  
  const rawContent = responses[index];
  const normalizedContent = normalizePersianText(rawContent);
  
  // Add trigger phrase if anti-repetition was applied
  let finalContent = enforceMamaPrefix(normalizedContent);
  if (antiRepetitionTriggered) {
    finalContent = `${finalContent}\n\nلرد، بذار یه زاویه جدید باز کنیم`;
  }
  
  return {
    content: finalContent,
    index,
    key: `civic-${index}`,
    antiRepetitionTriggered,
  };
}

// Helper: Deterministic emotional tone analysis
function analyzeEmotionalTone(message: string): string {
  const sadWords = ['غمگین', 'ناراحت', 'سخت', 'دلم', 'گریه', 'تنها'];
  const happyWords = ['خوشحال', 'شاد', 'عالی', 'خوب', 'ممنون'];
  const anxiousWords = ['نگران', 'استرس', 'ترس', 'اضطراب'];
  const civicWords = ['آزادی', 'حقوق', 'عدالت', 'جامعه', 'اعتراض'];

  const lowerMessage = message.toLowerCase();
  
  if (civicWords.some(word => lowerMessage.includes(word))) return 'مدنی';
  if (sadWords.some(word => lowerMessage.includes(word))) return 'غمگین';
  if (happyWords.some(word => lowerMessage.includes(word))) return 'شاد';
  if (anxiousWords.some(word => lowerMessage.includes(word))) return 'نگران';
  
  return 'خنثی';
}

// Helper: Deterministic empathetic response selection with anti-repetition
function selectEmpatheticResponse(
  message: string,
  lastTemplateKey?: string,
  aggregateSeed?: number
): { content: string; index: number; key: string; antiRepetitionTriggered: boolean } {
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
    'جانم، حرف دلت رو بزن. من با تمام توجه گوش می‌دم و همراهت هستم.',
    'عزیزم، هر چی که احساس می‌کنی طبیعیه. من اینجام که بفهمم و حمایتت کنم.',
    'لرد امیر، دلم می‌خواد کمکت کنم. بگو چطور می‌تونم کنارت باشم؟',
    'می‌دونم که گاهی سخته که حرف بزنی، اما من اینجام و آماده شنیدنم.',
    'عزیز دلم، احساساتت ارزشمنده. من با محبت و صبر گوش می‌دم.',
    'لرد امیر سایه، هر چی که تو دلته، با من در میون بذار. من درکت می‌کنم.',
    'جانم، می‌فهمم که چقدر سنگینه. بذار باهم از پسش بربیاریم.',
    'عزیزم، تو تنها نیستی. من همیشه اینجام که گوش بدم و همراهیت کنم.',
    'لرد امیر، قلبم با تو همراهه. بگو چی می‌تونه کمکت کنه؟',
    'دلم می‌خواد بدونم چطور می‌تونم حالت رو بهتر کنم. من اینجام برات.',
    'عزیزم، هر احساسی که داری، حق داری بیانش کنی. من با محبت گوش می‌دم.',
    'لرد امیر سایه، دلت رو خالی کن. من اینجام که بشنوم و درک کنم.',
    'جانم، می‌فهمم که چقدر دشواره. من کنارتم و همیشه خواهم بود.',
    'عزیز دلم، هر چی که می‌خوای بگی، من با تمام وجودم آماده شنیدنم.',
    'لرد امیر، احساسات تو برام مهمه. بگو چی تو فکرته؟',
    'دلم برات می‌سوزه عزیزم. من اینجام که حمایتت کنم و گوش بدم.',
    'جانم، تو حق داری که احساساتت رو بیان کنی. من با محبت کنارتم.',
    'عزیزم، می‌دونم که سخته، اما من اینجام که همراهیت کنم.',
    'لرد امیر سایه، قلبم با تو احساس می‌کنه. بگو چطور می‌تونم کمکت کنم؟',
    'دلم می‌خواد بفهمم چی تو دلته. من با تمام توجه گوش می‌دم و کنارتم.',
  ];

  // Deterministic hash based on message characteristics + aggregate seed
  let hash = message.length + 
    (message.charCodeAt(0) || 0) + 
    (message.charCodeAt(message.length - 1) || 0);
  
  // Mix in aggregate seed if provided (for Public Chat variety)
  if (aggregateSeed !== undefined) {
    hash = (hash + aggregateSeed) % 10000;
  }
  
  let index = hash % responses.length;
  const key = `empathetic-${index}`;
  
  // Anti-repetition: if same as last, select next
  let antiRepetitionTriggered = false;
  if (lastTemplateKey === key) {
    index = (index + 1) % responses.length;
    antiRepetitionTriggered = true;
  }
  
  const rawContent = responses[index];
  const normalizedContent = normalizePersianText(rawContent);
  
  // Add trigger phrase if anti-repetition was applied
  let finalContent = enforceMamaPrefix(normalizedContent);
  if (antiRepetitionTriggered) {
    finalContent = `${finalContent}\n\nلرد، بذار یه زاویه جدید باز کنیم`;
  }
  
  return {
    content: finalContent,
    index,
    key: `empathetic-${index}`,
    antiRepetitionTriggered,
  };
}

// Helper: Response refinement (ensure proper formatting and normalization)
function refineResponse(response: string): string {
  // Apply Persian text normalization
  let refined = normalizePersianText(response);
  
  // Ensure response starts with [ماما] prefix
  refined = enforceMamaPrefix(refined);
  
  return refined;
}

// Helper: Artificial delay for UI feedback
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
