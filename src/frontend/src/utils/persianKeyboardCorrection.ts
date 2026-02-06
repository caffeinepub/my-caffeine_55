/**
 * Persian keyboard layout auto-correction utility
 * Maps English keyboard characters to Persian equivalents
 */

// English to Persian keyboard mapping
const EN_TO_FA_MAP: Record<string, string> = {
  'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح',
  'a': 'ش', 's': 'س', 'd': 'ی', 'f': 'ب', 'g': 'ل', 'h': 'ا', 'j': 'ت', 'k': 'ن', 'l': 'م', ';': 'ک',
  'z': 'ظ', 'x': 'ط', 'c': 'ز', 'v': 'ر', 'b': 'ذ', 'n': 'د', 'm': 'پ', ',': 'و', '.': '.',
  '[': 'ج', ']': 'چ', '\\': '\\', '/': '/', '\'': 'گ',
  'Q': 'ض', 'W': 'ص', 'E': 'ث', 'R': 'ق', 'T': 'ف', 'Y': 'غ', 'U': 'ع', 'I': 'ه', 'O': 'خ', 'P': 'ح',
  'A': 'ش', 'S': 'س', 'D': 'ی', 'F': 'ب', 'G': 'ل', 'H': 'ا', 'J': 'ت', 'K': 'ن', 'L': 'م', ':': ':',
  'Z': 'ظ', 'X': 'ط', 'C': 'ز', 'V': 'ر', 'B': 'ذ', 'N': 'د', 'M': 'پ', '<': '>', '>': '<',
  '{': 'ج', '}': 'چ', '|': '|', '?': '؟', '"': '"',
};

// Persian character range for detection
const PERSIAN_CHAR_RANGE = /[\u0600-\u06FF]/;

/**
 * Check if a string appears to be Persian typed with English keyboard
 * Heuristic: mostly Latin characters with few/no valid English patterns
 */
function shouldCorrect(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  
  // If already contains Persian characters, don't correct
  if (PERSIAN_CHAR_RANGE.test(text)) return false;
  
  // Count Latin letters
  const latinLetters = text.match(/[a-zA-Z]/g);
  if (!latinLetters || latinLetters.length < 3) return false;
  
  // Check if it looks like English words (has common English patterns)
  const commonEnglishPatterns = /\b(the|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|may|might|must|hello|hi|yes|no|ok|okay|thanks|thank|you|me|my|your|this|that|what|when|where|who|why|how)\b/i;
  if (commonEnglishPatterns.test(text)) return false;
  
  // If mostly Latin letters and no obvious English patterns, likely Persian
  const totalChars = text.replace(/\s/g, '').length;
  const latinRatio = latinLetters.length / totalChars;
  
  return latinRatio > 0.5;
}

/**
 * Convert English keyboard input to Persian
 */
function convertToPersian(text: string): string {
  return text.split('').map(char => EN_TO_FA_MAP[char] || char).join('');
}

export interface CorrectionResult {
  corrected: string;
  wasChanged: boolean;
}

/**
 * Auto-correct Persian text typed with English keyboard
 * Returns the corrected text and whether it was changed
 */
export function correctPersianKeyboard(text: string): CorrectionResult {
  if (!shouldCorrect(text)) {
    return { corrected: text, wasChanged: false };
  }
  
  const corrected = convertToPersian(text);
  
  // Verify the correction produced Persian text
  const hasPersian = PERSIAN_CHAR_RANGE.test(corrected);
  
  if (!hasPersian) {
    // If no Persian characters resulted, don't apply correction
    return { corrected: text, wasChanged: false };
  }
  
  return { corrected, wasChanged: true };
}
