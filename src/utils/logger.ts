/**
 * Production-safe logger utility
 * - Logs only run in development mode (__DEV__ = true)
 * - Errors always log (for crash reporting in production)
 * - Can be easily integrated with Sentry or other crash reporting services
 */

const isDevelopment = __DEV__;

class Logger {
  /**
   * Debug logs - only in development
   */
  log(...args: any[]) {
    if (isDevelopment) {
      console.log(...args);
    }
  }

  /**
   * Info logs - only in development
   */
  info(...args: any[]) {
    if (isDevelopment) {
      console.info(...args);
    }
  }

  /**
   * Warning logs - only in development
   */
  warn(...args: any[]) {
    if (isDevelopment) {
      console.warn(...args);
    }
  }

  /**
   * Error logs - ALWAYS logs (including production)
   * Use this for errors you want to track in production
   */
  error(...args: any[]) {
    console.error(...args);
    // TODO: Send to crash reporting service (Sentry, Firebase Crashlytics, etc.)
  }

  /**
   * Debug logs with emoji - only in development
   */
  debug(emoji: string, ...args: any[]) {
    if (isDevelopment) {
      console.log(emoji, ...args);
    }
  }
}

export const logger = new Logger();

// Convenience exports
export const log = logger.log.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const debug = logger.debug.bind(logger);
