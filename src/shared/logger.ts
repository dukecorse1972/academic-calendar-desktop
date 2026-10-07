export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger | null = null;
  private isDebugEnabled: boolean = false;

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private constructor() {
    if (typeof process !== 'undefined' && process.env) {
      this.isDebugEnabled =
        process.env.DEBUG === 'true' ||
        process.env.ENABLE_DEBUG === '1' ||
        process.env.NODE_ENV === 'development';
    }
  }

  public setDebugEnabled(enabled: boolean): void {
    this.isDebugEnabled = enabled;
  }

  private formatMessage(level: LogLevel, context: string, message: string): string {
    const time = new Date().toISOString().split('T')[1].replace('Z', '');
    return `[${time}] [${level}] [${context}] ${message}`;
  }

  public debug(context: string, message: string, data?: any): void {
    if (!this.isDebugEnabled) return;
    if (data !== undefined) {
      console.log(this.formatMessage('DEBUG', context, message), data);
    } else {
      console.log(this.formatMessage('DEBUG', context, message));
    }
  }

  public info(context: string, message: string, data?: any): void {
    if (data !== undefined) {
      console.log(this.formatMessage('INFO', context, message), data);
    } else {
      console.log(this.formatMessage('INFO', context, message));
    }
  }

  public warn(context: string, message: string, data?: any): void {
    if (data !== undefined) {
      console.warn(this.formatMessage('WARN', context, message), data);
    } else {
      console.warn(this.formatMessage('WARN', context, message));
    }
  }

  public error(context: string, message: string, error?: any): void {
    if (error !== undefined) {
      console.error(this.formatMessage('ERROR', context, message), error);
    } else {
      console.error(this.formatMessage('ERROR', context, message));
    }
  }
}

export const logger = Logger.getInstance();
