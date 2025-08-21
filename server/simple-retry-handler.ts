/**
 * Simple Retry Handler for Ambient Audio
 * Minimal retry logic without complex circuit breakers
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  attemptsMade: number;
  totalTimeMs: number;
}

export class SimpleRetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 5000,
      ...config
    };
  }

  /**
   * Execute a function with simple exponential backoff retry
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: any;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        console.log(`🔄 ${operationName}: Attempt ${attempt}/${this.config.maxAttempts}`);
        
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ ${operationName}: Succeeded on attempt ${attempt}`);
        }
        
        return {
          success: true,
          result,
          attemptsMade: attempt,
          totalTimeMs: Date.now() - startTime
        };

      } catch (error: any) {
        lastError = error;
        console.error(`❌ ${operationName}: Attempt ${attempt} failed:`, error.message);

        // If this is the last attempt, don't wait
        if (attempt === this.config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.config.baseDelayMs * Math.pow(2, attempt - 1),
          this.config.maxDelayMs
        );

        console.log(`⏳ ${operationName}: Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // All attempts failed
    console.error(`💥 ${operationName}: All ${this.config.maxAttempts} attempts failed`);
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      attemptsMade: this.config.maxAttempts,
      totalTimeMs: Date.now() - startTime
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is worth retrying
   */
  static isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.status >= 500 && error.status < 600) {
      return true; // Server errors
    }
    
    if (error.status === 429) {
      return true; // Rate limit
    }

    // OpenAI specific retryable errors
    if (error.type === 'server_error' || error.type === 'rate_limit_exceeded') {
      return true;
    }

    return false;
  }
}

// Export default instance
export const simpleRetryHandler = new SimpleRetryHandler();