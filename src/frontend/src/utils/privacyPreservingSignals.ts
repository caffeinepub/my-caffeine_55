/**
 * Privacy-preserving learning signal derivation
 * Converts normalized private messages into anonymized, non-reversible aggregate signals
 * NO raw message text is included in the output
 */

export interface AnonymizedSignal {
  category: string;
  normalizedScore: number;
}

/**
 * Derive anonymized signals from a normalized private message
 * Returns ONLY numeric/aggregate fields suitable for storeAnonymizedSignal
 * NO raw text is included
 */
export function deriveAnonymizedSignals(normalizedMessage: string): AnonymizedSignal[] {
  const signals: AnonymizedSignal[] = [];

  // Coarse category buckets based on keyword presence
  const categories = {
    'احساسی': ['احساس', 'دل', 'قلب', 'عشق', 'غم', 'شاد', 'ناراحت', 'خوشحال'],
    'اجتماعی': ['جامعه', 'مردم', 'اجتماع', 'گروه', 'دوست', 'خانواده'],
    'مدنی': ['آزادی', 'حقوق', 'عدالت', 'اعتراض', 'کنشگری', 'مدنی'],
    'سوال': ['چی', 'چه', 'کی', 'کجا', 'چطور', 'چرا', '؟'],
    'کمک': ['کمک', 'راهنما', 'نیاز', 'لطف', 'ممنون'],
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

  // Add a length-based signal (coarse bucket)
  const lengthCategory = 
    normalizedMessage.length < 20 ? 'کوتاه' :
    normalizedMessage.length < 100 ? 'متوسط' : 'بلند';
  
  signals.push({
    category: `طول_${lengthCategory}`,
    normalizedScore: Math.min(normalizedMessage.length / 200, 1.0),
  });

  return signals;
}
