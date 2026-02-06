import type { FaqEntry } from '../backend';
import { measureSync } from '../utils/perf';

export interface MamaResponse {
  content: string;
  source: 'faq' | 'empathetic';
  feedback?: MamaResponseFeedback;
}

export interface MamaResponseFeedback {
  responseSource: 'faq' | 'empathetic';
  empatheticIndex?: number;
  processingNote: string;
}

// Deterministic empathetic response generator
// Uses simple hashing to select from a fixed set of supportive messages
function getEmpatheticResponse(userMessage: string): { content: string; index: number } {
  return measureSync('Empathetic response selection', () => {
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

    // Simple deterministic hash based on message length and first/last chars
    const hash = userMessage.length + 
      (userMessage.charCodeAt(0) || 0) + 
      (userMessage.charCodeAt(userMessage.length - 1) || 0);
    
    const index = hash % responses.length;
    return {
      content: `[ماما] ${responses[index]}`,
      index,
    };
  });
}

export async function getMamaResponse(
  userQuery: string,
  faqLookup: (question: string) => Promise<FaqEntry | null>
): Promise<MamaResponse> {
  const feedback: MamaResponseFeedback = {
    responseSource: 'empathetic',
    processingNote: '',
  };

  try {
    // FAQ lookup is already instrumented in ChatPage
    // No linear scan here - direct backend call with O(1) or O(log n) lookup
    const faqMatch = await faqLookup(userQuery);
    
    if (faqMatch) {
      feedback.responseSource = 'faq';
      feedback.processingNote = 'پاسخ از بانک دانش ماما';
      return {
        content: `[ماما] ${faqMatch.answer}`,
        source: 'faq',
        feedback,
      };
    }
  } catch (error) {
    // Safe logging without exposing full query content
    console.error('FAQ lookup failed:', error instanceof Error ? error.message : 'Unknown error');
    feedback.processingNote = 'خطا در جستجوی دانش، پاسخ همدلانه انتخاب شد';
  }

  // If no FAQ match, return empathetic response (deterministic, no iteration)
  const empatheticResponse = getEmpatheticResponse(userQuery);
  feedback.responseSource = 'empathetic';
  feedback.empatheticIndex = empatheticResponse.index;
  feedback.processingNote = `پاسخ همدلانه شماره ${empatheticResponse.index + 1}`;

  return {
    content: empatheticResponse.content,
    source: 'empathetic',
    feedback,
  };
}
