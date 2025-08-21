/**
 * Circuit Breaker Pattern for Transcription Services
 * Prevents cascade failures and implements intelligent fallback strategies
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxCalls: number;
}

export interface TranscriptionCircuitBreaker {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}

export class TranscriptionCircuitBreakerService {
  private breakers: Map<string, TranscriptionCircuitBreaker> = new Map();
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeoutMs: 60000, // 1 minute
    halfOpenMaxCalls: 3
  }) {
    this.config = config;
  }

  async executeWithBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const breaker = this.getOrCreateBreaker(serviceName);

    // Check if circuit is open
    if (breaker.state === 'OPEN') {
      if (this.shouldAttemptReset(breaker)) {
        breaker.state = 'HALF_OPEN';
        breaker.successCount = 0;
        console.log(`🔄 Circuit breaker ${serviceName}: Attempting reset (HALF_OPEN)`);
      } else {
        console.log(`⚡ Circuit breaker ${serviceName}: OPEN - using fallback`);
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Service ${serviceName} is temporarily unavailable`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess(serviceName);
      return result;
    } catch (error) {
      this.onFailure(serviceName);
      
      // If we have a fallback, use it when circuit opens or for critical failures
      if (fallback) {
        console.log(`🔧 Circuit breaker ${serviceName}: Using fallback after failure`);
        return await fallback();
      }
      
      throw error;
    }
  }

  private getOrCreateBreaker(serviceName: string): TranscriptionCircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0
      });
    }
    return this.breakers.get(serviceName)!;
  }

  private onSuccess(serviceName: string): void {
    const breaker = this.getOrCreateBreaker(serviceName);
    
    if (breaker.state === 'HALF_OPEN') {
      breaker.successCount++;
      if (breaker.successCount >= this.config.halfOpenMaxCalls) {
        breaker.state = 'CLOSED';
        breaker.failureCount = 0;
        console.log(`✅ Circuit breaker ${serviceName}: Reset to CLOSED`);
      }
    } else {
      breaker.failureCount = 0;
    }
  }

  private onFailure(serviceName: string): void {
    const breaker = this.getOrCreateBreaker(serviceName);
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failureCount >= this.config.failureThreshold) {
      breaker.state = 'OPEN';
      console.log(`🚨 Circuit breaker ${serviceName}: OPENED due to ${breaker.failureCount} failures`);
    }
  }

  private shouldAttemptReset(breaker: TranscriptionCircuitBreaker): boolean {
    return Date.now() - breaker.lastFailureTime >= this.config.resetTimeoutMs;
  }

  getStatus(serviceName: string): TranscriptionCircuitBreaker | null {
    return this.breakers.get(serviceName) || null;
  }

  getAllStatuses(): Record<string, TranscriptionCircuitBreaker> {
    const statuses: Record<string, TranscriptionCircuitBreaker> = {};
    this.breakers.forEach((breaker, serviceName) => {
      statuses[serviceName] = { ...breaker };
    });
    return statuses;
  }

  reset(serviceName?: string): void {
    if (serviceName) {
      this.breakers.delete(serviceName);
      console.log(`🔄 Circuit breaker ${serviceName}: Manually reset`);
    } else {
      this.breakers.clear();
      console.log(`🔄 All circuit breakers: Manually reset`);
    }
  }
}

// Global circuit breaker instance
export const transcriptionCircuitBreaker = new TranscriptionCircuitBreakerService();