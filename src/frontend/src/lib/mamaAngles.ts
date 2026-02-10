/**
 * Deterministic angle expansion module for Mama responses
 * Automatically generates multiple response angles without user configuration
 * Privacy-preserving: no storage, no raw-text logging
 */

export type AngleType = 
  | 'clarification'
  | 'step-by-step'
  | 'reframe'
  | 'pros-cons'
  | 'example'
  | 'summary'
  | 'next-steps'
  | 'empathetic'
  | 'diagnostic';

export interface AngleCandidate {
  type: AngleType;
  key: string;
  priority: number;
}

/**
 * Derive candidate angles from normalized user message
 * Returns multiple angle options deterministically based on message features
 */
export function deriveAngleCandidates(
  normalizedMessage: string,
  aggregateSeed?: number
): AngleCandidate[] {
  const candidates: AngleCandidate[] = [];
  const lowerMessage = normalizedMessage.toLowerCase();
  
  // Question indicators
  const hasQuestion = /[؟?]/.test(normalizedMessage) || 
    ['چی', 'چه', 'کی', 'کجا', 'چطور', 'چرا'].some(q => lowerMessage.includes(q));
  
  // Help/guidance indicators
  const needsHelp = ['کمک', 'راهنما', 'نیاز', 'چطور'].some(w => lowerMessage.includes(w));
  
  // Decision/choice indicators
  const hasDecision = ['انتخاب', 'تصمیم', 'باید', 'یا'].some(w => lowerMessage.includes(w));
  
  // Emotional indicators
  const hasEmotion = ['احساس', 'دل', 'قلب', 'غم', 'شاد', 'ناراحت'].some(w => lowerMessage.includes(w));
  
  // Complex/long message
  const isComplex = normalizedMessage.length > 100;
  
  // Deterministic priority calculation
  let basePriority = normalizedMessage.length % 10;
  if (aggregateSeed !== undefined) {
    basePriority = (basePriority + aggregateSeed) % 10;
  }
  
  // Build candidate list based on message features
  if (hasQuestion) {
    candidates.push({ type: 'clarification', key: 'angle-clarification', priority: basePriority + 8 });
    candidates.push({ type: 'step-by-step', key: 'angle-steps', priority: basePriority + 7 });
  }
  
  if (needsHelp) {
    candidates.push({ type: 'step-by-step', key: 'angle-steps', priority: basePriority + 9 });
    candidates.push({ type: 'next-steps', key: 'angle-next', priority: basePriority + 6 });
  }
  
  if (hasDecision) {
    candidates.push({ type: 'pros-cons', key: 'angle-pros-cons', priority: basePriority + 8 });
    candidates.push({ type: 'reframe', key: 'angle-reframe', priority: basePriority + 5 });
  }
  
  if (hasEmotion) {
    candidates.push({ type: 'empathetic', key: 'angle-empathetic', priority: basePriority + 10 });
    candidates.push({ type: 'diagnostic', key: 'angle-diagnostic', priority: basePriority + 4 });
  }
  
  if (isComplex) {
    candidates.push({ type: 'summary', key: 'angle-summary', priority: basePriority + 6 });
    candidates.push({ type: 'reframe', key: 'angle-reframe', priority: basePriority + 5 });
  }
  
  // Always include example and empathetic as fallbacks
  if (candidates.length === 0 || !candidates.some(c => c.type === 'empathetic')) {
    candidates.push({ type: 'empathetic', key: 'angle-empathetic', priority: basePriority + 3 });
  }
  
  candidates.push({ type: 'example', key: 'angle-example', priority: basePriority + 2 });
  
  // Sort by priority (highest first) and deduplicate by type
  const sorted = candidates.sort((a, b) => b.priority - a.priority);
  const unique = sorted.filter((c, idx, arr) => 
    arr.findIndex(x => x.type === x.type) === idx
  );
  
  return unique;
}

/**
 * Select primary angle deterministically with anti-repetition
 * Returns the best angle that differs from lastTemplateKey
 */
export function selectPrimaryAngle(
  candidates: AngleCandidate[],
  lastTemplateKey?: string,
  aggregateSeed?: number
): { angle: AngleCandidate; antiRepetitionTriggered: boolean } {
  if (candidates.length === 0) {
    // Fallback to empathetic
    return {
      angle: { type: 'empathetic', key: 'angle-empathetic', priority: 0 },
      antiRepetitionTriggered: false,
    };
  }
  
  // Try to select top candidate
  let selectedIndex = 0;
  let antiRepetitionTriggered = false;
  
  // Anti-repetition: skip if same as last
  if (lastTemplateKey && candidates[0].key === lastTemplateKey && candidates.length > 1) {
    selectedIndex = 1;
    antiRepetitionTriggered = true;
  }
  
  // Mix in aggregate seed for variety
  if (aggregateSeed !== undefined && candidates.length > 2) {
    const seedOffset = aggregateSeed % candidates.length;
    selectedIndex = (selectedIndex + seedOffset) % candidates.length;
  }
  
  return {
    angle: candidates[selectedIndex],
    antiRepetitionTriggered,
  };
}

/**
 * Get all stable template keys for anti-repetition tracking
 * Returns all angle keys that participate in anti-repetition
 */
export function getAllAngleKeys(): string[] {
  return [
    'angle-clarification',
    'angle-steps',
    'angle-reframe',
    'angle-pros-cons',
    'angle-example',
    'angle-summary',
    'angle-next-steps',
    'angle-empathetic',
    'angle-diagnostic',
  ];
}
