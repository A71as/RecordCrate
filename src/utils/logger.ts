/**
 * Logger utility for conditional logging based on environment
 * Only logs debug messages in development mode
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';

  debug(...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  info(...args: unknown[]): void {
    console.info(...args);
  }

  warn(...args: unknown[]): void {
    console.warn(...args);
  }

  error(...args: unknown[]): void {
    console.error(...args);
  }

  log(level: LogLevel, ...args: unknown[]): void {
    switch (level) {
      case 'debug':
        this.debug(...args);
        break;
      case 'info':
        this.info(...args);
        break;
      case 'warn':
        this.warn(...args);
        break;
      case 'error':
        this.error(...args);
        break;
    }
  }
}

export const logger = new Logger();
