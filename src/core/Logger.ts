export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  tag: string;
  message: string;
  data?: unknown;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxBufferSize = 200;
  private minLevel: LogLevel = 'INFO';

  private levelValues: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  public log(level: LogLevel, tag: string, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      tag,
      message,
      data,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxBufferSize) {
      this.logs.shift();
    }

    if (this.levelValues[level] >= this.levelValues[this.minLevel]) {
      const formatted = `[${new Date(entry.timestamp).toISOString()}] [${level}] [${tag}] ${message}`;
      if (level === 'ERROR') {
        console.error(formatted, data ?? '');
      } else if (level === 'WARN') {
        console.warn(formatted, data ?? '');
      } else {
        console.log(formatted, data ?? '');
      }
    }
  }

  public debug(tag: string, message: string, data?: unknown): void {
    this.log('DEBUG', tag, message, data);
  }

  public info(tag: string, message: string, data?: unknown): void {
    this.log('INFO', tag, message, data);
  }

  public warn(tag: string, message: string, data?: unknown): void {
    this.log('WARN', tag, message, data);
  }

  public error(tag: string, message: string, data?: unknown): void {
    this.log('ERROR', tag, message, data);
  }

  public getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  public clear(): void {
    this.logs = [];
  }
}
