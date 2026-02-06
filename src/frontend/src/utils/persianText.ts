/**
 * Persian text normalization and formatting utilities
 * Provides deterministic text refinement for consistent Persian output
 */

/**
 * Normalize Persian text spacing and punctuation
 * - Ensures consistent spacing around punctuation marks
 * - Collapses multiple spaces/newlines
 * - Applies نیم‌فاصله (ZWNJ) where appropriate
 */
export function normalizePersianText(text: string): string {
  let normalized = text;

  // Collapse multiple spaces into one
  normalized = normalized.replace(/\s+/g, ' ');

  // Collapse multiple newlines (max 2)
  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  // Ensure space after punctuation marks (if not already present)
  normalized = normalized.replace(/([.!?،؛])([^\s])/g, '$1 $2');

  // Remove space before punctuation marks
  normalized = normalized.replace(/\s+([.!?،؛])/g, '$1');

  // Apply ZWNJ (نیم‌فاصله) for common compound words
  // می + verb
  normalized = normalized.replace(/می\s+([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی])/g, 'می‌$1');
  
  // نمی + verb
  normalized = normalized.replace(/نمی\s+([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی])/g, 'نمی‌$1');

  // Trim leading/trailing whitespace
  normalized = normalized.trim();

  return normalized;
}

/**
 * Enforce the [ماما] prefix format
 * Ensures all Mama responses start with the exact prefix
 */
export function enforceMamaPrefix(text: string): string {
  // Remove any existing [Mama] or [ماما] prefix
  let cleaned = text.replace(/^\[(?:Mama|ماما)\]\s*/i, '');
  
  // Add the canonical [ماما] prefix
  return `[ماما] ${cleaned}`;
}

/**
 * Sanitize user prompt for storage (remove sensitive content)
 * Returns a safe, redacted version suitable for metadata storage
 */
export function sanitizeUserPrompt(prompt: string): string {
  // Truncate to first 50 chars and add ellipsis if longer
  if (prompt.length > 50) {
    return prompt.substring(0, 50) + '...';
  }
  return prompt;
}
