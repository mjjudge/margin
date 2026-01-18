// src/utils/logger.ts
// Safe logging wrapper that filters personal/sensitive fields

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Fields that should never be logged
const SENSITIVE_FIELDS = [
  'text',           // meaning entry text
  'notes',          // session notes
  'email',          // user email
  'password',       // never log passwords
  'access_token',   // auth tokens
  'refresh_token',
  'token',
];

// Patterns to redact in string values
const REDACT_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // emails
];

/**
 * Recursively sanitize an object, redacting sensitive fields
 */
function sanitize(value: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]';

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    let sanitized = value;
    for (const pattern of REDACT_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    // Truncate long strings (likely user content)
    if (sanitized.length > 100) {
      return sanitized.substring(0, 50) + '...[TRUNCATED]';
    }
    return sanitized;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    // Only show first few items and count
    const preview = value.slice(0, 3).map(v => sanitize(v, depth + 1));
    if (value.length > 3) {
      return [...preview, `...(${value.length - 3} more)`];
    }
    return preview;
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(val, depth + 1);
      }
    }
    return sanitized;
  }

  return String(value);
}

/**
 * Format log arguments for output
 */
function formatArgs(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return sanitize(arg);
    }
    if (arg instanceof Error) {
      return {
        name: arg.name,
        message: sanitize(arg.message),
        stack: arg.stack?.split('\n').slice(0, 5).join('\n'),
      };
    }
    return sanitize(arg);
  });
}

/**
 * Check if we should log at this level
 * In production, we might want to filter debug logs
 */
function shouldLog(_level: LogLevel): boolean {
  // For now, log everything. In production, you might check:
  // if (__DEV__) return true;
  // return level !== 'debug';
  return true;
}

/**
 * Safe logger that filters personal data
 */
export const logger = {
  debug(tag: string, message: string, ...args: unknown[]) {
    if (!shouldLog('debug')) return;
    console.debug(`[${tag}]`, message, ...formatArgs(args));
  },

  info(tag: string, message: string, ...args: unknown[]) {
    if (!shouldLog('info')) return;
    console.info(`[${tag}]`, message, ...formatArgs(args));
  },

  warn(tag: string, message: string, ...args: unknown[]) {
    if (!shouldLog('warn')) return;
    console.warn(`[${tag}]`, message, ...formatArgs(args));
  },

  error(tag: string, message: string, ...args: unknown[]) {
    if (!shouldLog('error')) return;
    console.error(`[${tag}]`, message, ...formatArgs(args));
  },
};

export default logger;
