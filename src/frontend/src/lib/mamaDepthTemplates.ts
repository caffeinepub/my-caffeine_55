/**
 * Deterministic library of deeper, structured response templates
 * Increases Q&A pattern depth with diagnosis, steps, questions, reframes, summaries
 * Preserves Mama tone and uses enforceMamaPrefix for consistent output
 */

import { normalizePersianText, enforceMamaPrefix } from '../utils/persianText';
import type { AngleType } from './mamaAngles';

export interface DepthTemplate {
  key: string;
  angle: AngleType;
  structure: string;
  safetyConstraints: string[];
}

/**
 * Get structured depth template for a given angle
 * Returns template with explicit structure markers
 */
export function getDepthTemplate(angle: AngleType, messageFeatures: {
  hasQuestion: boolean;
  needsHelp: boolean;
  hasDecision: boolean;
  hasEmotion: boolean;
  isComplex: boolean;
}): DepthTemplate | null {
  const templates: Record<AngleType, DepthTemplate> = {
    'diagnostic': {
      key: 'depth-diagnostic',
      angle: 'diagnostic',
      structure: 'عزیزم، بذار ببینم چی داریم:\n\n• {diagnosis}\n• {observation}\n\nحالا بگو، این تشخیص درسته؟',
      safetyConstraints: ['no-medical-advice', 'empathetic-tone'],
    },
    'step-by-step': {
      key: 'depth-steps',
      angle: 'step-by-step',
      structure: 'لرد امیر، بیا قدم به قدم پیش بریم:\n\n۱. {step1}\n۲. {step2}\n۳. {step3}\n\nکدوم قدم رو می‌خوای بیشتر باز کنیم؟',
      safetyConstraints: ['actionable-steps', 'safe-guidance'],
    },
    'reframe': {
      key: 'depth-reframe',
      angle: 'reframe',
      structure: 'جانم، بذار از یه زاویه دیگه نگاه کنیم:\n\n{alternative_perspective}\n\nاین دیدگاه چطور؟',
      safetyConstraints: ['respectful-reframe', 'empathetic-tone'],
    },
    'pros-cons': {
      key: 'depth-pros-cons',
      angle: 'pros-cons',
      structure: 'عزیز دلم، بیا باهم ببینیم:\n\n✓ مزایا: {pros}\n✗ معایب: {cons}\n\nچی برات مهم‌تره؟',
      safetyConstraints: ['balanced-view', 'no-judgment'],
    },
    'summary': {
      key: 'depth-summary',
      angle: 'summary',
      structure: 'لرد امیر سایه، خلاصه‌اش اینه:\n\n{summary}\n\nدرست متوجه شدم؟',
      safetyConstraints: ['concise-summary', 'empathetic-tone'],
    },
    'next-steps': {
      key: 'depth-next-steps',
      angle: 'next-steps',
      structure: 'عزیزم، حالا چی؟\n\n→ {next_action_1}\n→ {next_action_2}\n\nکدوم راه رو انتخاب می‌کنی؟',
      safetyConstraints: ['actionable-next-steps', 'safe-guidance'],
    },
    'clarification': {
      key: 'depth-clarification',
      angle: 'clarification',
      structure: 'جانم، بذار مطمئن بشم:\n\n• {clarifying_question_1}\n• {clarifying_question_2}\n\nبگو تا بهتر کمکت کنم.',
      safetyConstraints: ['open-questions', 'empathetic-tone'],
    },
    'example': {
      key: 'depth-example',
      angle: 'example',
      structure: 'لرد امیر، یه مثال بزنم:\n\n{example_scenario}\n\nاین مثال کمک کرد؟',
      safetyConstraints: ['relatable-example', 'safe-content'],
    },
    'empathetic': {
      key: 'depth-empathetic',
      angle: 'empathetic',
      structure: 'عزیز دلم، می‌فهمم:\n\n{empathetic_reflection}\n\nمن اینجام، بگو چطور می‌تونم کمکت کنم؟',
      safetyConstraints: ['deep-empathy', 'supportive-tone'],
    },
  };
  
  return templates[angle] || null;
}

/**
 * Generate deeper structured response using template and message features
 * Returns normalized, prefixed response with depth structure
 */
export function generateDeepResponse(
  angle: AngleType,
  normalizedMessage: string,
  aggregateSeed?: number
): string {
  const lowerMessage = normalizedMessage.toLowerCase();
  
  // Deterministic content selection based on message + seed
  let hash = normalizedMessage.length + (normalizedMessage.charCodeAt(0) || 0);
  if (aggregateSeed !== undefined) {
    hash = (hash + aggregateSeed) % 10000;
  }
  
  let response = '';
  
  switch (angle) {
    case 'diagnostic':
      response = hash % 2 === 0
        ? 'عزیزم، بذار ببینم چی داریم:\n\n• به نظر می‌رسه که یه موقعیت پیچیده داری\n• احساسات مختلفی توش درگیره\n\nحالا بگو، این تشخیص درسته؟'
        : 'جانم، بذار تحلیل کنیم:\n\n• یه چالش مهم پیش رو داری\n• نیاز به راهنمایی و حمایت داری\n\nدرست می‌بینم؟';
      break;
      
    case 'step-by-step':
      response = hash % 3 === 0
        ? 'لرد امیر، بیا قدم به قدم پیش بریم:\n\n۱. اول، نفس عمیق بکش و آروم باش\n۲. بعد، دقیق بگو چی می‌خوای\n۳. آخر، یه قدم کوچیک بردار\n\nکدوم قدم رو می‌خوای بیشتر باز کنیم؟'
        : hash % 3 === 1
        ? 'عزیزم، بریم مرحله به مرحله:\n\n۱. وضعیت فعلی رو بپذیر\n۲. گزینه‌هات رو بشناس\n۳. یه انتخاب آگاهانه بکن\n\nکجا نیاز به کمک بیشتری داری؟'
        : 'جانم، یه نقشه راه بسازیم:\n\n۱. هدفت رو مشخص کن\n۲. منابعت رو جمع کن\n۳. شروع کن و پیش برو\n\nچی بیشتر توضیح بدم؟';
      break;
      
    case 'reframe':
      response = hash % 2 === 0
        ? 'جانم، بذار از یه زاویه دیگه نگاه کنیم:\n\nشاید این چالش، فرصتیه برای رشد و یادگیری. گاهی سخت‌ترین لحظه‌ها، قوی‌ترینمون می‌کنن.\n\nاین دیدگاه چطور؟'
        : 'عزیز دلم، یه دید جدید:\n\nاین موقعیت می‌تونه نقطه عطفی باشه. هر پایانی، شروع چیز تازه‌ایه.\n\nباهاش موافقی؟';
      break;
      
    case 'pros-cons':
      response = hash % 2 === 0
        ? 'عزیز دلم، بیا باهم ببینیم:\n\n✓ مزایا: می‌تونی تصمیم آگاهانه بگیری، کنترل بیشتری داری\n✗ معایب: ممکنه استرس‌زا باشه، زمان می‌بره\n\nچی برات مهم‌تره؟'
        : 'لرد امیر، دو طرف ماجرا:\n\n✓ خوبی‌ها: فرصت رشد، تجربه جدید\n✗ چالش‌ها: عدم اطمینان، نیاز به صبر\n\nکدوم بیشتر تو ذهنته؟';
      break;
      
    case 'summary':
      response = hash % 2 === 0
        ? 'لرد امیر سایه، خلاصه‌اش اینه:\n\nیه موقعیت مهم داری که نیاز به تصمیم‌گیری داره. احساسات و منطق هر دو مهمن.\n\nدرست متوجه شدم؟'
        : 'عزیزم، به طور خلاصه:\n\nداری با یه چالش روبرو می‌شی که نیاز به توجه و مراقبت داره. من کنارتم.\n\nاینطوریه؟';
      break;
      
    case 'next-steps':
      response = hash % 2 === 0
        ? 'عزیزم، حالا چی؟\n\n→ می‌تونی یه لحظه استراحت کنی و فکر کنی\n→ می‌تونی با کسی که بهش اعتماد داری صحبت کنی\n\nکدوم راه رو انتخاب می‌کنی؟'
        : 'جانم، قدم بعدی:\n\n→ می‌تونی احساساتت رو بنویسی و بررسی کنی\n→ می‌تونی یه برنامه کوچیک برای خودت بسازی\n\nچی بیشتر کمکت می‌کنه؟';
      break;
      
    case 'clarification':
      response = hash % 2 === 0
        ? 'جانم، بذار مطمئن بشم:\n\n• دقیقاً چی تو دلت می‌گذره؟\n• چه چیزی بیشتر نگرانت می‌کنه؟\n\nبگو تا بهتر کمکت کنم.'
        : 'عزیز دلم، چند تا سوال:\n\n• این موضوع از کی شروع شده؟\n• چی می‌تونه حالت رو بهتر کنه؟\n\nبا من در میون بذار.';
      break;
      
    case 'example':
      response = hash % 2 === 0
        ? 'لرد امیر، یه مثال بزنم:\n\nفرض کن یه نفر تو موقعیت مشابه باشه. اون می‌تونه یه قدم کوچیک برداره، مثلاً با یه دوست صحبت کنه یا یه فعالیت آرامش‌بخش انجام بده.\n\nاین مثال کمک کرد؟'
        : 'عزیزم، مثلاً:\n\nتصور کن کسی که دوستش داری تو همین وضعیت باشه. چه نصیحتی بهش می‌کردی؟ گاهی همون نصیحت برای خودمونم خوبه.\n\nچطور؟';
      break;
      
    case 'empathetic':
      response = hash % 3 === 0
        ? 'عزیز دلم، می‌فهمم:\n\nاحساس می‌کنم که الان سخته و دلت می‌خواد کسی بفهمتت. من اینجام و با تمام وجودم گوش می‌دم.\n\nمن اینجام، بگو چطور می‌تونم کمکت کنم؟'
        : hash % 3 === 1
        ? 'لرد امیر سایه، قلبم با توئه:\n\nمی‌دونم که این لحظه سنگینه و احساس تنهایی می‌کنی. اما تو تنها نیستی، من همراهتم.\n\nبگو چی تو دلته؟'
        : 'جانم، درکت می‌کنم:\n\nگاهی زندگی سخته و نیاز داریم که کسی فقط بشنوه و بفهمه. من اینجام برای همین.\n\nحرف دلت رو بزن.';
      break;
      
    default:
      response = 'عزیزم، می‌فهمم که چقدر سخته. من اینجام که گوش بدم و همراهت باشم. بگو چی تو دلته؟';
  }
  
  const normalized = normalizePersianText(response);
  return enforceMamaPrefix(normalized);
}

/**
 * Get all depth template keys for anti-repetition
 */
export function getAllDepthTemplateKeys(): string[] {
  return [
    'depth-diagnostic',
    'depth-steps',
    'depth-reframe',
    'depth-pros-cons',
    'depth-summary',
    'depth-next-steps',
    'depth-clarification',
    'depth-example',
    'depth-empathetic',
  ];
}
