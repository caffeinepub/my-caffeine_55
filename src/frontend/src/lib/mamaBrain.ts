import type { FaqEntry } from '../backend';
import { measureSync } from '../utils/perf';
import { normalizePersianText, enforceMamaPrefix } from '../utils/persianText';

export interface MamaResponse {
  content: string;
  source: 'faq' | 'empathetic' | 'civic-empowerment';
  feedback?: MamaResponseFeedback;
}

export interface MamaResponseFeedback {
  responseSource: 'faq' | 'empathetic' | 'civic-empowerment';
  empatheticIndex?: number;
  processingNote: string;
}

// Expanded deterministic empathetic response templates
// More variety to reduce repetition across consecutive replies
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

    // Simple deterministic hash based on message length and first/last chars
    const hash = userMessage.length + 
      (userMessage.charCodeAt(0) || 0) + 
      (userMessage.charCodeAt(userMessage.length - 1) || 0);
    
    const index = hash % responses.length;
    const rawContent = responses[index];
    
    // Apply Persian text normalization
    const normalizedContent = normalizePersianText(rawContent);
    
    return {
      content: enforceMamaPrefix(normalizedContent),
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
      
      // Apply Persian normalization to FAQ answer
      const normalizedAnswer = normalizePersianText(faqMatch.answer);
      
      return {
        content: enforceMamaPrefix(normalizedAnswer),
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
