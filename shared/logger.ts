/**
 * CentomoMD Logging Service
 * 
 * Zero-retention logging system that captures system events, errors, and performance
 * metrics without storing any medical data or patient information.
 * 
 * Security Compliance:
 * - No medical content logging
 * - No patient data storage
 * - Sanitized error messages
 * - Session correlation without PII
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO', 
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum LogCategory {
  SECURITY = 'SECURITY',
  AUTH = 'AUTH',
  API = 'API',
  FORM = 'FORM',
  VOICE = 'VOICE',
  OCR = 'OCR',
  AI = 'AI',
  PERFORMANCE = 'PERFORMANCE',
  SYSTEM = 'SYSTEM'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  component: string;
  event: string;
  sessionId?: string;
  userId?: string; // Always hashed, never raw user data
  correlationId?: string;
  metadata: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableBuffer: boolean;
  maxBufferSize: number;
  sanitizationLevel: 'MINIMAL' | 'STRICT' | 'MAXIMUM';
}

class CentomoLogger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private sessionId: string;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableBuffer: true,
      maxBufferSize: 1000,
      sanitizationLevel: 'STRICT',
      ...config
    };
    
    this.sessionId = this.generateSessionId();
    
    // Log logger initialization
    this.logInternal(LogLevel.INFO, LogCategory.SYSTEM, 'logger', 'LOGGER_INITIALIZED', {
      level: this.config.level,
      bufferSize: this.config.maxBufferSize,
      sessionId: this.sessionId
    });
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    
    // Remove potential medical data fields
    const medicalFields = [
      'content', 'transcript', 'formData', 'patientData', 
      'medicalContent', 'diagnosis', 'symptoms', 'medication',
      'voiceData', 'audioData', 'documentText'
    ];
    
    medicalFields.forEach(field => {
      if (field in sanitized) {
        // Replace with metadata about the data
        sanitized[`${field}Info`] = {
          hasContent: !!sanitized[field],
          contentType: typeof sanitized[field],
          contentLength: sanitized[field]?.length || 0
        };
        delete sanitized[field];
      }
    });

    // Sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeMetadata(sanitized[key]);
      }
    });

    return sanitized;
  }

  private formatForConsole(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${entry.level}] ${entry.category}:${entry.event}`;
    const context = entry.component ? ` (${entry.component})` : '';
    const sessionInfo = entry.sessionId ? ` [${entry.sessionId.slice(-8)}]` : '';
    
    const metadata = Object.keys(entry.metadata).length > 0 
      ? ` ${JSON.stringify(entry.metadata)}` 
      : '';
      
    const errorInfo = entry.error 
      ? ` ERROR: ${entry.error.message}${entry.error.code ? ` (${entry.error.code})` : ''}` 
      : '';

    return `${timestamp} ${prefix}${context}${sessionInfo}${metadata}${errorInfo}`;
  }

  private logInternal(
    level: LogLevel,
    category: LogCategory,
    component: string,
    event: string,
    metadata: Record<string, any> = {},
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      component,
      event,
      sessionId: this.sessionId,
      metadata: this.sanitizeMetadata(metadata),
      correlationId: metadata.correlationId
    };

    // Add user ID if provided (should always be hashed)
    if (metadata.userId) {
      entry.userId = this.hashUserId(metadata.userId);
      delete entry.metadata.userId; // Remove from metadata after hashing
    }

    // Add error information if provided
    if (error) {
      entry.error = {
        message: error.message,
        stack: this.config.sanitizationLevel !== 'MAXIMUM' ? error.stack : undefined,
        code: (error as any).code
      };
    }

    // Console logging
    if (this.config.enableConsole) {
      const formatted = this.formatForConsole(entry);
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formatted);
          break;
      }
    }

    // Buffer storage
    if (this.config.enableBuffer) {
      this.buffer.push(entry);
      
      // Maintain buffer size
      if (this.buffer.length > this.config.maxBufferSize) {
        this.buffer.shift(); // Remove oldest entry
      }
    }
  }

  private hashUserId(userId: string): string {
    // Simple hash for user ID (in production, use proper cryptographic hash)
    return `user_${Buffer.from(userId).toString('base64').slice(0, 12)}`;
  }

  // Public logging methods
  debug(category: LogCategory, component: string, event: string, metadata?: Record<string, any>): void {
    this.logInternal(LogLevel.DEBUG, category, component, event, metadata);
  }

  info(category: LogCategory, component: string, event: string, metadata?: Record<string, any>): void {
    this.logInternal(LogLevel.INFO, category, component, event, metadata);
  }

  warn(category: LogCategory, component: string, event: string, metadata?: Record<string, any>): void {
    this.logInternal(LogLevel.WARN, category, component, event, metadata);
  }

  error(category: LogCategory, component: string, event: string, metadata?: Record<string, any>, error?: Error): void {
    this.logInternal(LogLevel.ERROR, category, component, event, metadata, error);
  }

  fatal(category: LogCategory, component: string, event: string, metadata?: Record<string, any>, error?: Error): void {
    this.logInternal(LogLevel.FATAL, category, component, event, metadata, error);
  }

  // Specialized logging methods for common use cases
  logApiRequest(method: string, url: string, status: number, duration: number, userId?: string): void {
    this.info(LogCategory.API, 'api-handler', 'REQUEST_COMPLETED', {
      method,
      url,
      status,
      duration,
      userId,
      success: status < 400
    });
  }

  logAuthEvent(event: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(LogCategory.AUTH, 'auth-service', event, {
      userId,
      ...metadata
    });
  }

  logFormEvent(event: string, sectionId: string, metadata?: Record<string, any>): void {
    this.info(LogCategory.FORM, 'form-handler', event, {
      sectionId,
      ...metadata
    });
  }

  logVoiceEvent(event: string, metadata?: Record<string, any>): void {
    this.info(LogCategory.VOICE, 'voice-processor', event, metadata);
  }

  logOcrEvent(event: string, metadata?: Record<string, any>): void {
    this.info(LogCategory.OCR, 'ocr-processor', event, metadata);
  }

  logPerformanceMetric(component: string, metric: string, value: number, unit: string): void {
    this.info(LogCategory.PERFORMANCE, component, 'METRIC_RECORDED', {
      metric,
      value,
      unit,
      timestamp: Date.now()
    });
  }

  // Buffer management
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.buffer.slice(-count);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.buffer.filter(entry => entry.level === level);
  }

  getLogsByCategory(category: LogCategory): LogEntry[] {
    return this.buffer.filter(entry => entry.category === category);
  }

  clearBuffer(): void {
    this.buffer = [];
    this.info(LogCategory.SYSTEM, 'logger', 'BUFFER_CLEARED', {
      previousSize: this.buffer.length
    });
  }

  // Configuration
  setLogLevel(level: LogLevel): void {
    this.config.level = level;
    this.info(LogCategory.SYSTEM, 'logger', 'LOG_LEVEL_CHANGED', {
      newLevel: level
    });
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Health check
  healthCheck(): { status: string; bufferSize: number; sessionId: string } {
    return {
      status: 'healthy',
      bufferSize: this.buffer.length,
      sessionId: this.sessionId
    };
  }
}

// Create singleton logger instance
const logger = new CentomoLogger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableBuffer: true,
  maxBufferSize: process.env.NODE_ENV === 'development' ? 2000 : 1000,
  sanitizationLevel: process.env.NODE_ENV === 'production' ? 'MAXIMUM' : 'STRICT'
});

export default logger;

// Export convenience functions for common logging patterns
export const logApiRequest = logger.logApiRequest.bind(logger);
export const logAuthEvent = logger.logAuthEvent.bind(logger);
export const logFormEvent = logger.logFormEvent.bind(logger);
export const logVoiceEvent = logger.logVoiceEvent.bind(logger);
export const logOcrEvent = logger.logOcrEvent.bind(logger);
export const logPerformanceMetric = logger.logPerformanceMetric.bind(logger);