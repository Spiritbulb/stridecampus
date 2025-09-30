/**
 * Security configuration for the frontend application
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://stride-media-api.spiritbulb.workers.dev',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Security headers for API requests
export const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_REQUESTS_PER_HOUR: 1000,
  BACKOFF_MULTIPLIER: 2,
  MAX_BACKOFF: 30000, // 30 seconds
};

// File upload security
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-rar-compressed'
  ],
  DANGEROUS_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar'
  ],
};

// Input validation
export const INPUT_VALIDATION = {
  MAX_STRING_LENGTH: 10000,
  MAX_USERNAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_TAGS_COUNT: 10,
  MAX_TAG_LENGTH: 30,
};

// Content Security Policy
export const CSP_CONFIG = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' data: https:",
  'connect-src': "'self' https://stride-media-api.spiritbulb.workers.dev https://*.supabase.co",
  'font-src': "'self' data:",
  'object-src': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'frame-ancestors': "'none'",
};

// Sanitization patterns
export const SANITIZATION_PATTERNS = {
  // Remove potentially dangerous HTML tags
  DANGEROUS_TAGS: /<(script|object|embed|link|meta|iframe)[^>]*>/gi,
  // Remove javascript: URLs
  JAVASCRIPT_URLS: /javascript:/gi,
  // Remove data: URLs (except for images)
  DATA_URLS: /data:(?!image\/)/gi,
  // Remove suspicious characters
  SUSPICIOUS_CHARS: /[<>"'&]/g,
};

// Error messages for security
export const SECURITY_ERRORS = {
  INVALID_FILE_TYPE: 'File type not allowed',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed',
  DANGEROUS_FILENAME: 'Filename contains potentially dangerous characters',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  INVALID_INPUT: 'Invalid input provided',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NETWORK_ERROR: 'Network error occurred',
};

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `${SECURITY_ERRORS.FILE_TOO_LARGE} (max ${FILE_UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB)`
    };
  }

  // Check file type
  if (!FILE_UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: SECURITY_ERRORS.INVALID_FILE_TYPE
    };
  }

  // Check for dangerous extensions
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (FILE_UPLOAD_CONFIG.DANGEROUS_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: SECURITY_ERRORS.DANGEROUS_FILENAME
    };
  }

  return { valid: true };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string, maxLength?: number): string {
  let sanitized = input;

  // Remove dangerous tags
  sanitized = sanitized.replace(SANITIZATION_PATTERNS.DANGEROUS_TAGS, '');
  
  // Remove javascript URLs
  sanitized = sanitized.replace(SANITIZATION_PATTERNS.JAVASCRIPT_URLS, '');
  
  // Remove data URLs (except images)
  sanitized = sanitized.replace(SANITIZATION_PATTERNS.DATA_URLS, '');

  // Truncate if max length specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized.trim();
}

/**
 * Validate API response
 */
export function validateApiResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }

  // Check for success field
  if (typeof response.success !== 'boolean') {
    return false;
  }

  // If error response, check for error field
  if (!response.success && !response.error) {
    return false;
  }

  return true;
}

/**
 * Create secure fetch request
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...SECURITY_HEADERS,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Rate limiting helper
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Check if we're under the limit
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    this.requests.push(now);
    return true;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// Export rate limiter instances
export const apiRateLimiter = new RateLimiter(
  RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE,
  60 * 1000 // 1 minute
);

export const uploadRateLimiter = new RateLimiter(10, 60 * 1000); // 10 uploads per minute
