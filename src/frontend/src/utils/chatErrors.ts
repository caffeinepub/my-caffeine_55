/**
 * Chat error handling utilities
 * Provides safe error extraction and user-friendly messages
 */

export interface ErrorInfo {
  userMessage: string;
  isAuthError: boolean;
  debugInfo: string;
}

/**
 * Extract user-readable error message from unknown error
 */
export function extractErrorInfo(error: unknown): ErrorInfo {
  let userMessage = 'خطای ناشناخته رخ داد';
  let isAuthError = false;
  let debugInfo = 'Unknown error';
  
  if (error instanceof Error) {
    debugInfo = error.message;
    
    // Check for authorization/authentication errors
    const lowerMessage = error.message.toLowerCase();
    if (
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('only authenticated users') ||
      lowerMessage.includes('only users can') ||
      lowerMessage.includes('permission')
    ) {
      isAuthError = true;
      userMessage = 'لطفاً ابتدا وارد شوید';
    } else if (lowerMessage.includes('actor not available')) {
      isAuthError = true;
      userMessage = 'در حال اتصال... لطفاً دوباره تلاش کنید';
    } else if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      userMessage = 'خطای شبکه. لطفاً اتصال اینترنت خود را بررسی کنید';
    } else {
      userMessage = 'ارسال پیام ناموفق بود';
    }
  } else if (typeof error === 'string') {
    debugInfo = error;
    if (error.toLowerCase().includes('unauthorized')) {
      isAuthError = true;
      userMessage = 'لطفاً ابتدا وارد شوید';
    }
  } else if (error && typeof error === 'object') {
    debugInfo = JSON.stringify(error);
  }
  
  return { userMessage, isAuthError, debugInfo };
}

/**
 * Create sanitized debug log (avoid logging full message content)
 * Ensures no sensitive user data is exposed in logs
 */
export function createDebugLog(operation: string, error: unknown, metadata?: Record<string, any>): void {
  const errorInfo = extractErrorInfo(error);
  
  const sanitizedMetadata = metadata ? {
    ...metadata,
    // Remove sensitive content - only log length
    content: metadata.content ? `[${metadata.content.length} chars]` : undefined,
    // Remove any other potentially sensitive fields
    userMessage: undefined,
    query: metadata.query ? `[${metadata.query.length} chars]` : undefined,
  } : {};
  
  console.error(`[Chat ${operation}]`, {
    error: errorInfo.debugInfo,
    isAuthError: errorInfo.isAuthError,
    ...sanitizedMetadata,
  });
}
