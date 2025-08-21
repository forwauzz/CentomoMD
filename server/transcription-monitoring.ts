/**
 * Real-time Transcription Monitoring and Health Dashboard
 * Phase 1 implementation for system observability
 */

import { transcriptionCircuitBreaker } from './transcription-circuit-breaker';
import { enhancedWhisperService } from './enhanced-whisper-service';

export interface TranscriptionHealthMetrics {
  timestamp: string;
  circuitBreakerStatus: Record<string, any>;
  serviceHealth: any;
  recentPerformance: {
    successRate: number;
    averageProcessingTime: number;
    totalRequests: number;
    failedRequests: number;
    lastHour: {
      requests: number;
      failures: number;
      avgProcessingTime: number;
    };
  };
  qualityMetrics: {
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
    fallbackUsage: number;
  };
  recommendations: string[];
}

class TranscriptionMonitoringService {
  private performanceHistory: Array<{
    timestamp: number;
    success: boolean;
    processingTime: number;
    quality: 'high' | 'medium' | 'low';
    source: string;
  }> = [];

  private readonly MAX_HISTORY_SIZE = 1000;
  private readonly HOUR_IN_MS = 60 * 60 * 1000;

  recordTranscriptionAttempt(
    success: boolean,
    processingTime: number,
    quality: 'high' | 'medium' | 'low' = 'medium',
    source: string = 'whisper'
  ): void {
    this.performanceHistory.push({
      timestamp: Date.now(),
      success,
      processingTime,
      quality,
      source
    });

    // Keep history manageable
    if (this.performanceHistory.length > this.MAX_HISTORY_SIZE) {
      this.performanceHistory = this.performanceHistory.slice(-this.MAX_HISTORY_SIZE / 2);
    }
  }

  getHealthMetrics(): TranscriptionHealthMetrics {
    const now = Date.now();
    const oneHourAgo = now - this.HOUR_IN_MS;
    
    // Filter recent data
    const recentData = this.performanceHistory.filter(entry => entry.timestamp > oneHourAgo);
    const allData = this.performanceHistory;

    // Calculate success rate
    const totalRequests = allData.length;
    const failedRequests = allData.filter(entry => !entry.success).length;
    const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests) * 100 : 0;

    // Calculate average processing time
    const successfulRequests = allData.filter(entry => entry.success);
    const averageProcessingTime = successfulRequests.length > 0 
      ? successfulRequests.reduce((sum, entry) => sum + entry.processingTime, 0) / successfulRequests.length
      : 0;

    // Recent hour metrics
    const recentSuccessful = recentData.filter(entry => entry.success);
    const recentAvgProcessingTime = recentSuccessful.length > 0
      ? recentSuccessful.reduce((sum, entry) => sum + entry.processingTime, 0) / recentSuccessful.length
      : 0;

    // Quality distribution
    const qualityDistribution = this.getQualityDistribution(allData);

    // Generate recommendations
    const recommendations = this.generateRecommendations(successRate, averageProcessingTime, qualityDistribution);

    return {
      timestamp: new Date().toISOString(),
      circuitBreakerStatus: transcriptionCircuitBreaker.getAllStatuses(),
      serviceHealth: enhancedWhisperService.getServiceStatus(),
      recentPerformance: {
        successRate,
        averageProcessingTime,
        totalRequests,
        failedRequests,
        lastHour: {
          requests: recentData.length,
          failures: recentData.filter(entry => !entry.success).length,
          avgProcessingTime: recentAvgProcessingTime
        }
      },
      qualityMetrics: qualityDistribution,
      recommendations
    };
  }

  private getQualityDistribution(data: typeof this.performanceHistory): {
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
    fallbackUsage: number;
  } {
    const total = data.length;
    if (total === 0) {
      return { highQuality: 0, mediumQuality: 0, lowQuality: 0, fallbackUsage: 0 };
    }

    const high = data.filter(entry => entry.quality === 'high').length;
    const medium = data.filter(entry => entry.quality === 'medium').length;
    const low = data.filter(entry => entry.quality === 'low').length;
    const fallback = data.filter(entry => entry.source === 'local-fallback').length;

    return {
      highQuality: (high / total) * 100,
      mediumQuality: (medium / total) * 100,
      lowQuality: (low / total) * 100,
      fallbackUsage: (fallback / total) * 100
    };
  }

  private generateRecommendations(
    successRate: number,
    avgProcessingTime: number,
    quality: ReturnType<typeof this.getQualityDistribution>
  ): string[] {
    const recommendations: string[] = [];

    if (successRate < 90) {
      recommendations.push('Success rate below 90% - investigate API connectivity and authentication');
    }

    if (avgProcessingTime > 10000) { // 10 seconds
      recommendations.push('High processing times detected - consider optimizing audio chunk sizes');
    }

    if (quality.lowQuality > 30) {
      recommendations.push('High percentage of low-quality transcriptions - check audio input quality');
    }

    if (quality.fallbackUsage > 20) {
      recommendations.push('Frequent fallback usage indicates primary service issues');
    }

    if (recommendations.length === 0) {
      recommendations.push('System operating within normal parameters');
    }

    return recommendations;
  }

  // Get performance trends
  getPerformanceTrends(windowMinutes: number = 60): {
    timestamps: string[];
    successRates: number[];
    processingTimes: number[];
    qualityScores: number[];
  } {
    const windowMs = windowMinutes * 60 * 1000;
    const now = Date.now();
    const startTime = now - windowMs;
    
    // Group data into 5-minute buckets
    const bucketSize = 5 * 60 * 1000; // 5 minutes
    const buckets = Math.ceil(windowMs / bucketSize);
    
    const timestamps: string[] = [];
    const successRates: number[] = [];
    const processingTimes: number[] = [];
    const qualityScores: number[] = [];

    for (let i = 0; i < buckets; i++) {
      const bucketStart = startTime + (i * bucketSize);
      const bucketEnd = bucketStart + bucketSize;
      
      const bucketData = this.performanceHistory.filter(
        entry => entry.timestamp >= bucketStart && entry.timestamp < bucketEnd
      );

      timestamps.push(new Date(bucketStart).toISOString());
      
      if (bucketData.length > 0) {
        const successCount = bucketData.filter(entry => entry.success).length;
        successRates.push((successCount / bucketData.length) * 100);
        
        const successfulEntries = bucketData.filter(entry => entry.success);
        const avgProcessingTime = successfulEntries.length > 0
          ? successfulEntries.reduce((sum, entry) => sum + entry.processingTime, 0) / successfulEntries.length
          : 0;
        processingTimes.push(avgProcessingTime);
        
        // Quality score: high=3, medium=2, low=1
        const qualityScore = bucketData.reduce((sum, entry) => {
          const score = entry.quality === 'high' ? 3 : entry.quality === 'medium' ? 2 : 1;
          return sum + score;
        }, 0) / bucketData.length;
        qualityScores.push(qualityScore);
      } else {
        successRates.push(0);
        processingTimes.push(0);
        qualityScores.push(0);
      }
    }

    return { timestamps, successRates, processingTimes, qualityScores };
  }

  // Reset monitoring data
  reset(): void {
    this.performanceHistory = [];
    console.log('🔄 Transcription monitoring data reset');
  }

  // Get current status summary
  getStatusSummary(): string {
    const metrics = this.getHealthMetrics();
    const circuitState = metrics.circuitBreakerStatus['whisper-api']?.state || 'UNKNOWN';
    
    return `Transcription Service Status: ${circuitState} | Success Rate: ${metrics.recentPerformance.successRate.toFixed(1)}% | Avg Processing: ${(metrics.recentPerformance.averageProcessingTime / 1000).toFixed(1)}s`;
  }
}

// Global monitoring service
export const transcriptionMonitoring = new TranscriptionMonitoringService();