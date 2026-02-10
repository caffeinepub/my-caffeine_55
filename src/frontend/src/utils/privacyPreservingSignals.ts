/**
 * Privacy-preserving learning signal derivation
 * Converts normalized private messages into anonymized, non-reversible aggregate signals
 * NO raw message text is included in the output
 * EXPANDED: Richer categories for better self-improvement
 */

export interface AnonymizedSignal {
  category: string;
  normalizedScore: number;
}

/**
 * Derive anonymized signals from a normalized private message
 * Returns ONLY numeric/aggregate fields suitable for storeAnonymizedSignal
 * NO raw text is included
 * EXPANDED: More granular intent, tone, and structure categories
 */
export function deriveAnonymizedSignals(normalizedMessage: string): AnonymizedSignal[] {
  const signals: AnonymizedSignal[] = [];

  // Expanded category buckets with richer heuristics
  const categories = {
    // Intent buckets
    'سوال': ['چی', 'چه', 'کی', 'کجا', 'چطور', 'چرا', '؟'],
    'کمک': ['کمک', 'راهنما', 'نیاز', 'لطف', 'ممنون', 'می‌تونی'],
    'تصمیم': ['انتخاب', 'تصمیم', 'باید', 'یا', 'کدوم'],
    
    // Emotional tone buckets
    'احساسی': ['احساس', 'دل', 'قلب', 'عشق', 'غم', 'شاد', 'ناراحت', 'خوشحال'],
    'نگرانی': ['نگران', 'استرس', 'ترس', 'اضطراب', 'مشکل'],
    'امیدوار': ['امید', 'خوب', 'بهتر', 'می‌تونم', 'موفق'],
    
    // Social/civic buckets
    'اجتماعی': ['جامعه', 'مردم', 'اجتماع', 'گروه', 'دوست', 'خانواده'],
    'مدنی': ['آزادی', 'حقوق', 'عدالت', 'اعتراض', 'کنشگری', 'مدنی'],
    
    // Structure preference hints
    'پیچیده': ['اما', 'ولی', 'چون', 'پس', 'بنابراین'],
    'مستقیم': ['فقط', 'ساده', 'مستقیم', 'خلاصه'],
  };

  const lowerMessage = normalizedMessage.toLowerCase();

  // Calculate presence score for each category (0.0 to 1.0)
  for (const [category, keywords] of Object.entries(categories)) {
    const matchCount = keywords.filter(kw => lowerMessage.includes(kw)).length;
    const score = Math.min(matchCount / keywords.length, 1.0);

    // Only include categories with non-zero scores
    if (score > 0) {
      signals.push({
        category,
        normalizedScore: score,
      });
    }
  }

  // Add length-based signal (coarse bucket)
  const lengthCategory = 
    normalizedMessage.length < 20 ? 'کوتاه' :
    normalizedMessage.length < 100 ? 'متوسط' : 'بلند';
  
  signals.push({
    category: `طول_${lengthCategory}`,
    normalizedScore: Math.min(normalizedMessage.length / 200, 1.0),
  });

  // Add question density signal
  const questionMarks = (normalizedMessage.match(/[؟?]/g) || []).length;
  if (questionMarks > 0) {
    signals.push({
      category: 'تراکم_سوال',
      normalizedScore: Math.min(questionMarks / 3, 1.0),
    });
  }

  return signals;
}
