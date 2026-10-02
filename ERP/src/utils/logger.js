/**
 * Production-ready logger utility with structured logging
 * Handles console output safely and consistently across the app
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
  4: 'FATAL',
};

// Determine log level from environment or default to INFO
const CURRENT_LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL
  ? LOG_LEVELS[import.meta.env.VITE_LOG_LEVEL] || LOG_LEVELS.INFO
  : LOG_LEVELS.INFO;

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level, context, message, data) => {
  const timestamp = getTimestamp();
  const levelName = LOG_LEVEL_NAMES[level];
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${levelName}] [${context}]${dataStr} ${message}`;
};

const getConsoleMethod = (level) => {
  switch (level) {
    case LOG_LEVELS.DEBUG:
      return console.debug;
    case LOG_LEVELS.INFO:
      return console.info;
    case LOG_LEVELS.WARN:
      return console.warn;
    case LOG_LEVELS.ERROR:
    case LOG_LEVELS.FATAL:
      return console.error;
    default:
      return console.log;
  }
};

/**
 * Logger class - use logger.create(contextName) to get a scoped logger
 */
class Logger {
  constructor(context) {
    this.context = context || 'APP';
  }

  log(level, message, data = null) {
    if (level < CURRENT_LOG_LEVEL) {
      return; // Skip logs below current level
    }

    const formatted = formatMessage(level, this.context, message, data);
    const consoleMethod = getConsoleMethod(level);

    try {
      if (data && typeof data === 'object') {
        consoleMethod(formatted, data);
      } else {
        consoleMethod(formatted);
      }
    } catch (err) {
      // Fallback in case console fails
      console.error('Logger error:', err.message);
    }
  }

  debug(message, data) {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message, data) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message, data) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message, data) {
    this.log(LOG_LEVELS.ERROR, message, data);
  }

  fatal(message, data) {
    this.log(LOG_LEVELS.FATAL, message, data);
  }
}

// Create scoped loggers
export const createLogger = (context) => {
  return new Logger(context);
};

export const logger = createLogger('APP');
export default logger;
