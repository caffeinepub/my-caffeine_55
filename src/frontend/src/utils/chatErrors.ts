/**
 * Chat error handling utilities
 * Provides structured error classification and sanitized logging
 */

export type ErrorClassification = 'auth' | 'actor-not-ready' | 'network' | 'unknown';

export interface ErrorInfo {
  classification: ErrorClassification;
  userMessage: string;
  debugMessage: string;
}

/**
 * Extract structured error information from an error object
 * Classifies errors and provides user-friendly Persian messages
 */
export function extractErrorInfo(error: unknown): ErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Auth-related errors
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('authentication required') ||
    lowerMessage.includes('not authenticated') ||
    lowerMessage.includes('login')
  ) {
    return {
      classification: 'auth',
      userMessage: 'لطفاً ابتدا وارد شوید',
      debugMessage: errorMessage,
    };
  }

  // Actor not ready errors
  if (
    lowerMessage.includes('actor not available') ||
    lowerMessage.includes('actor not ready') ||
    lowerMessage.includes('actor still initializing') ||
    lowerMessage.includes('connecting')
  ) {
    return {
      classification: 'actor-not-ready',
      userMessage: 'در حال اتصال... لطفاً لحظه‌ای صبر کنید',
      debugMessage: errorMessage,
    };
  }

  // Network-related errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('connection')
  ) {
    return {
      classification: 'network',
      userMessage: 'خطای شبکه. لطفاً دوباره تلاش کنید',
      debugMessage: errorMessage,
    };
  }

  // Unknown errors
  return {
    classification: 'unknown',
    userMessage: 'خطایی رخ داد. لطفاً دوباره تلاش کنید',
    debugMessage: errorMessage,
  };
}

/**
 * Create a sanitized debug log entry
 * Excludes sensitive user data from logs
 */
export function createDebugLog(
  operation: string,
  error: unknown,
  context: Record<string, unknown>
): void {
  const errorInfo = extractErrorInfo(error);
  
  // Sanitize context: remove any content fields
  const sanitizedContext = { ...context };
  delete sanitizedContext.content;
  delete sanitizedContext.message;
  delete sanitizedContext.query;
  
  console.error(`[${operation}] ${errorInfo.classification}:`, {
    debugMessage: errorInfo.debugMessage,
    context: sanitizedContext,
  });
}
